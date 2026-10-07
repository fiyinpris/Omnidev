import admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.replace(/^["']|["']$/g, "");
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
// Two narrow queries: expired bots, and bots with a chunk due now.
// FIX: also picks up bots that are MISSING `nextIncrementAt` entirely —
// these are bots activated by the Admin Dashboard (handleTarget) or by the
// old activate-bots cron, which never stamped the field. Without this,
// those bots matched 0 queries and their balance never grew.
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
    let backfilledCount = 0;

    // ── 1) EXPIRE bots whose time is up ──────────────────────────────────
    const expiredSnap = await db
      .collection("users")
      .where("botStatus", "==", "activated")
      .where("botExpiresAt", "<=", nowTs)
      .limit(500)
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

    // ── 2) APPLY increments that are due ─────────────────────────────────
    // 2a) Bots stamped with nextIncrementAt (new-style activation)
    const dueSnap = await db
      .collection("users")
      .where("botStatus", "==", "activated")
      .where("nextIncrementAt", "<=", nowTs)
      .get();

    // 2b) Bots MISSING nextIncrementAt (activated via Admin Dashboard or old
    //     cron). Firestore: `== null` matches docs where the field is absent.
    const legacySnap = await db
      .collection("users")
      .where("botStatus", "==", "activated")
      .where("nextIncrementAt", "==", null)
      .limit(100)
      .get();

    const dueDocs = [...dueSnap.docs];
    for (const d of legacySnap.docs) {
      if (!dueDocs.some((x) => x.id === d.id)) dueDocs.push(d);
    }

    for (const docSnap of dueDocs) {
      const uid = docSnap.id;

      try {
        await db.runTransaction(async (tx) => {
          const freshDoc = await tx.get(docSnap.ref);
          const freshData = freshDoc.data();
          if (!freshData || freshData.botStatus !== "activated") return;

          const applied = freshData.incrementsApplied || 0;
          const sched = freshData.incrementSchedule || [];
          const startMs = freshData.incrementScheduleStartMs || 0;

          // Safety: bot with no schedule, corrupt start, or an already-finished
          // schedule. Point nextIncrementAt at botExpiresAt so this doc LEAVES
          // the legacy `== null` query permanently and only resurfaces when the
          // expire query disables it. (Deleting the field instead would make it
          // match `== null` again every single minute — the read leak that was
          // exhausting your quota. Also guards sched[applied] being undefined,
          // which crashed this handler with a 500 every minute.)
          if (sched.length === 0 || !startMs || applied >= sched.length) {
            tx.update(docSnap.ref, {
              nextIncrementAt: freshData.botExpiresAt
                ? freshData.botExpiresAt
                : admin.firestore.FieldValue.delete(),
            });
            return;
          }

          const elapsedMs = now - startMs;
          const due = sched
            .slice(applied)
            .filter((inc) => elapsedMs >= inc.offsetMs);
          if (due.length === 0) {
            // Not due yet — stamp the pointer so we find it again at the right time
            if (applied < sched.length) {
              tx.update(docSnap.ref, {
                nextIncrementAt: admin.firestore.Timestamp.fromMillis(
                  startMs + sched[applied].offsetMs,
                ),
              });
            }
            return;
          }

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

          if (newApplied < sched.length) {
            update.nextIncrementAt = admin.firestore.Timestamp.fromMillis(
              startMs + sched[newApplied].offsetMs,
            );
          } else {
            // Schedule finished — point at expiry instead of deleting the
            // field. A deleted field matches `nextIncrementAt == null` every
            // minute until the bot expires (read leak).
            update.nextIncrementAt = freshData.botExpiresAt
              ? freshData.botExpiresAt
              : admin.firestore.FieldValue.delete();
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
              description:
                "OmniDev trading profit +$" + formatMoney(inc.amount),
            });
          }
        });
      } catch (docErr) {
        console.error(`[apply-increments] Doc ${uid} failed:`, docErr.message);
      }

      appliedCount++;
    }

    res.status(200).json({
      status: "ok",
      applied: appliedCount,
      expired: expiredCount,
      backfilled: backfilledCount,
    });
  } catch (err) {
    console.error("[apply-increments] ERROR:", err.message);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
}
