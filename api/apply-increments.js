import admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // Handle private key: strip surrounding quotes, convert \n to actual newlines
    if (privateKey) {
      // Remove surrounding quotes if present
      privateKey = privateKey.replace(/^[\"']|[\"']$/g, "");
      // Convert literal \n to actual newlines (for Vercel dashboard format)
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    if (
      !privateKey ||
      !process.env.FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_CLIENT_EMAIL
    ) {
      console.error("Missing Firebase environment variables");
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("Firebase Admin initialized");
  } catch (err) {
    console.error("Firebase Admin init error:", err.message);
  }
}

const db = admin.firestore();
const CRON_SECRET = process.env.CRON_SECRET || "omnidev-cron-default-CHANGE-ME";

function formatMoney(val) {
  if (!val && val !== 0) return "0.00";
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return "0.00";
  const str = num.toFixed(10);
  const parts = str.split(".");
  return parts[0] + "." + (parts[1] ? parts[1].substring(0, 2) : "00");
}

// QUOTA FIX -------------------------------------------------------------------
// OLD: read EVERY user with botStatus == "activated" on every run
//      (288 runs/day × 2 reads per bot). That is what exhausted the 50k/day
//      Firestore quota.
// NEW: two narrow queries that only return docs needing work THIS run:
//        1. bots whose time has expired  -> get disabled
//        2. bots with a chunk due now    -> get the balance bump
//      A query that returns 0 docs costs 0 reads, so idle runs are now free.
//      Timing/behavior for users is identical: chunks still land on the same
//      schedule, bots still expire at the same moment.
//      `nextIncrementAt` is stamped on the user doc at activation time.
export default async function handler(req, res) {
  try {
    const secret = req.headers["x-cron-secret"] || req.query.secret;
    if (secret !== CRON_SECRET) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const now = Date.now();
    const nowTs = admin.firestore.Timestamp.now();
    let appliedCount = 0;
    let expiredCount = 0;

    // ── 1) EXPIRE bots whose time is up ──────────────────────────────────
    // Only returns bots that are actually expired (usually 0 docs → 0 reads).
    const expiredSnap = await db
      .collection("users")
      .where("botStatus", "==", "activated")
      .where("botExpiresAt", "<=", nowTs)
      .get();

    for (const docSnap of expiredSnap.docs) {
      const user = docSnap.data();
      const uid = docSnap.id;
      const schedule = user.incrementSchedule || [];
      const appliedCountUser = user.incrementsApplied || 0;

      const remaining = schedule.slice(appliedCountUser);
      const residual = remaining.reduce((s, d) => s + d.amount, 0);

      const finalBalance = parseFloat(
        ((user.initialBalance || 0) + (user.targetAmount || 0)).toFixed(2),
      );

      await docSnap.ref.update({
        botStatus: "disabled",
        botActive: false,
        balance: finalBalance,
        incrementsApplied: schedule.length,
        nextIncrementAt: admin.firestore.FieldValue.delete(),
      });

      if (residual > 0) {
        await db
          .collection("users")
          .doc(uid)
          .collection("transactions")
          .add({
            type: "bot_profit",
            amount: residual,
            source: "bot_flush",
            status: "completed",
            timestamp: admin.firestore.Timestamp.now(),
            description:
              "OmniDev final balance adjustment +$" + formatMoney(residual),
          });
      }

      const txnSnap = await db
        .collection("adminTransactions")
        .where("userId", "==", uid)
        .where("type", "==", "bot_trading")
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      if (!txnSnap.empty) {
        await txnSnap.docs[0].ref.update({
          status: "disabled",
          completedAt: admin.firestore.Timestamp.now(),
          note: "Bot trading completed - time expired",
        });
      }

      expiredCount++;
    }

    // ── 2) APPLY increments that are actually due ────────────────────────
    // Only returns bots with a chunk due right now (usually 0 → 0 reads).
    const dueSnap = await db
      .collection("users")
      .where("botStatus", "==", "activated")
      .where("nextIncrementAt", "<=", nowTs)
      .get();

    for (const docSnap of dueSnap.docs) {
      const user = docSnap.data();
      const uid = docSnap.id;

      await db.runTransaction(async (tx) => {
        const freshDoc = await tx.get(docSnap.ref);
        const freshData = freshDoc.data();

        const applied = freshData.incrementsApplied || 0;
        const sched = freshData.incrementSchedule || [];
        const startMs = freshData.incrementScheduleStartMs || 0;
        const elapsedMs = now - startMs;

        const due = sched
          .slice(applied)
          .filter((inc) => elapsedMs >= inc.offsetMs);
        if (due.length === 0) return;

        const totalIncrease = due.reduce((s, inc) => s + inc.amount, 0);
        const currentBalance =
          freshData.balance || freshData.initialBalance || 0;
        const newBalance = parseFloat(
          (currentBalance + totalIncrease).toFixed(2),
        );

        const newApplied = applied + due.length;
        const update = {
          balance: newBalance,
          incrementsApplied: newApplied,
        };

        // Re-arm the "due" pointer for the next chunk so this doc is found
        // again exactly when its next chunk is due. When the schedule is
        // finished, remove the field so the doc stops matching the query.
        if (newApplied < sched.length) {
          update.nextIncrementAt = admin.firestore.Timestamp.fromMillis(
            startMs + sched[newApplied].offsetMs,
          );
        } else {
          update.nextIncrementAt = admin.firestore.FieldValue.delete();
        }
        tx.update(docSnap.ref, update);

        for (const inc of due) {
          const txnRef = db
            .collection("users")
            .doc(uid)
            .collection("transactions")
            .doc();
          tx.set(txnRef, {
            type: "bot_profit",
            amount: inc.amount,
            source: "bot",
            status: "completed",
            timestamp: admin.firestore.Timestamp.now(),
            description: "OmniDev trading profit +$" + formatMoney(inc.amount),
          });
        }
      });

      appliedCount++;
    }

    res.status(200).json({
      status: "ok",
      applied: appliedCount,
      expired: expiredCount,
    });
  } catch (err) {
    console.error("[apply-increments] ERROR:", err.message);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
}
