// api/apply-increments.js
// Vercel Serverless Function — runs on cron-job.org ping

import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, "
"),
    }),
  });
}

const db = admin.firestore();
const CRON_SECRET = process.env.CRON_SECRET || "omnidev-cron-default-CHANGE-ME";

function formatMoney(val) {
  if (!val && val !== 0) return "0.00";
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return "0.00";
  const str = num.toFixed(10);
  const [intPart, decPart] = str.split(".");
  return `${intPart}.${decPart ? decPart.substring(0, 2) : "00"}`;
}

export default async function handler(req, res) {
  const secret = req.headers["x-cron-secret"] || req.query.secret;
  if (secret !== CRON_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const now = Date.now();
  let appliedCount = 0;
  let expiredCount = 0;

  try {
    const snap = await db
      .collection("users")
      .where("botStatus", "==", "activated")
      .get();

    if (snap.empty) {
      return res.status(200).json({
        status: "ok",
        applied: 0,
        expired: 0,
        message: "No active bots",
      });
    }

    for (const docSnap of snap.docs) {
      const user = docSnap.data();
      const uid = docSnap.id;
      const expMs = user.botExpiresAt?.toMillis?.() || 0;
      const schedule = user.incrementSchedule || [];
      const startMs = user.incrementScheduleStartMs || 0;
      const appliedCountUser = user.incrementsApplied || 0;

      // ── BOT EXPIRED ───────────────────────────────────────────────────────
      if (now >= expMs) {
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
              description: `OmniDev final balance adjustment +$${formatMoney(residual)}`,
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
        continue;
      }

      // ── BOT STILL ACTIVE — apply due chunks ──────────────────────────────
      if (appliedCountUser >= schedule.length) continue;

      const elapsedMs = now - startMs;
      const due = schedule
        .slice(appliedCountUser)
        .filter((inc) => elapsedMs >= inc.offsetMs);
      if (due.length === 0) continue;

      await db.runTransaction(async (tx) => {
        const freshDoc = await tx.get(docSnap.ref);
        const freshData = freshDoc.data();
        if ((freshData.incrementsApplied || 0) !== appliedCountUser) return;

        const totalIncrease = due.reduce((s, inc) => s + inc.amount, 0);
        const currentBalance =
          freshData.balance || freshData.initialBalance || 0;
        const newBalance = parseFloat(
          (currentBalance + totalIncrease).toFixed(2),
        );

        tx.update(docSnap.ref, {
          balance: newBalance,
          incrementsApplied: appliedCountUser + due.length,
        });

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
            description: `OmniDev trading profit +$${formatMoney(inc.amount)}`,
          });
        }
      });

      appliedCount++;
    }

    res.status(200).json({
      status: "ok",
      applied: appliedCount,
      expired: expiredCount,
      checked: snap.docs.length,
    });
  } catch (err) {
    console.error("[apply-increments]", err);
    res.status(500).json({ status: "error", message: err.message });
  }
}