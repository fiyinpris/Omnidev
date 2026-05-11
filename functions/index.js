const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

// ── CONFIG: Set this in Firebase Console → Functions config ──
// Run: firebase functions:config:set cron.secret="your-secret-here"
const CRON_SECRET =
  functions.config().cron?.secret || "omnidev-cron-default-CHANGE-ME";

function formatMoney(val) {
  if (!val && val !== 0) return "0.00";
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return "0.00";
  const str = num.toFixed(10);
  const [intPart, decPart] = str.split(".");
  return `${intPart}.${decPart ? decPart.substring(0, 2) : "00"}`;
}

// ── Generate increment schedule ──────────────────────────────────────────────
function generateIncrementSchedule(targetAmount, totalHours) {
  if (!targetAmount || targetAmount <= 0 || !totalHours || totalHours <= 0)
    return [];

  const totalMs = totalHours * 3600 * 1000;
  const chunks = [];
  let remaining = Math.round(targetAmount * 100) / 100;
  let sevenHundredCount = 0;

  while (remaining > 0.005) {
    let maxAllowed = Math.min(remaining, 700);
    if (sevenHundredCount >= 2) {
      maxAllowed = Math.min(maxAllowed, 699);
    }

    let chunk;
    const roll = Math.random();

    if (roll < 0.35) {
      chunk = 50 + Math.random() * 150;
    } else if (roll < 0.75) {
      chunk = 300 + Math.random() * 200;
    } else {
      chunk = 600 + Math.random() * 100;
    }

    chunk = Math.round(Math.min(chunk, maxAllowed));

    if (remaining - chunk < 50 && remaining - chunk > 0) {
      chunk = remaining;
    }

    if (chunk === 700) {
      sevenHundredCount++;
    }

    chunks.push(chunk);
    remaining = Math.round((remaining - chunk) * 100) / 100;
  }

  if (chunks.length === 0) return [];
  const n = chunks.length;

  const startBuffer = 2 * 60 * 1000;
  const endBuffer = Math.min(
    totalMs - 2 * 60 * 1000,
    Math.max(startBuffer + 60000, totalMs - 2 * 60 * 1000),
  );
  const usableMs = endBuffer - startBuffer;
  const slotSize = usableMs / n;

  const increments = chunks.map((amount, i) => {
    const slotStart = startBuffer + i * slotSize;
    const jitter = (Math.random() - 0.5) * slotSize * 0.4;
    const offsetMs = Math.round(
      Math.max(startBuffer, Math.min(endBuffer, slotStart + jitter)),
    );
    return { amount, offsetMs };
  });

  increments.sort((a, b) => a.offsetMs - b.offsetMs);

  for (let i = 1; i < increments.length; i++) {
    const minNext = increments[i - 1].offsetMs + 60000;
    if (increments[i].offsetMs < minNext) {
      increments[i].offsetMs = minNext;
    }
  }

  for (let i = increments.length - 1; i >= 0; i--) {
    const cap = endBuffer - (increments.length - 1 - i) * 60000;
    if (increments[i].offsetMs > cap) increments[i].offsetMs = cap;
  }

  return increments;
}

// ═════════════════════════════════════════════════════════════════════════════
// FUNCTION 1 — autoActivatePendingBots (v1 scheduled, Spark-compatible)
// Runs every 1 minute automatically via Firebase, no cron-job.org needed
// ═════════════════════════════════════════════════════════════════════════════
exports.autoActivatePendingBots = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context) => {
    const now = Date.now();
    let activatedCount = 0;

    try {
      const snap = await db
        .collection("users")
        .where("pendingTarget", "==", true)
        .get();

      if (snap.empty) {
        console.log("[autoActivatePendingBots] No pending bots");
        return null;
      }

      for (const docSnap of snap.docs) {
        const user = docSnap.data();
        const analysingExpMs = user.analysingExpiresAt?.toMillis?.() || 0;
        if (now <= analysingExpMs) continue;

        let gracePeriodMs = user.gracePeriodMs;
        if (!gracePeriodMs) {
          gracePeriodMs = (2 + Math.random() * 3) * 60 * 1000;
          await docSnap.ref.update({ gracePeriodMs });
          console.log(
            `[autoActivatePendingBots] Set grace period for ${user.email}`,
          );
          continue;
        }
        if (now < analysingExpMs + gracePeriodMs) continue;

        const hours = user.botHours || 1;
        const target = user.targetAmount || 0;
        const nowTs = admin.firestore.Timestamp.now();
        const botExpiresAt = admin.firestore.Timestamp.fromMillis(
          now + hours * 3600 * 1000,
        );
        const schedule = generateIncrementSchedule(target, hours);

        await docSnap.ref.update({
          botStatus: "activated",
          botActive: true,
          botActivatedAt: nowTs,
          botExpiresAt,
          pendingTarget: false,
          gracePeriodMs: admin.firestore.FieldValue.delete(),
          lastTargetSetAt: nowTs,
          incrementSchedule: schedule,
          incrementScheduleStartMs: now,
          incrementsApplied: 0,
        });

        // Update existing bot_trading transaction or create new
        const txnSnap = await db
          .collection("adminTransactions")
          .where("userId", "==", docSnap.id)
          .where("type", "==", "bot_trading")
          .orderBy("timestamp", "desc")
          .limit(1)
          .get();

        if (!txnSnap.empty) {
          await txnSnap.docs[0].ref.update({
            status: "trading",
            botExpiresAt,
            botActivatedAt: nowTs,
            note: "Auto-activated after analysing + grace period",
            updatedAt: nowTs,
          });
        } else {
          await db.collection("adminTransactions").add({
            userId: docSnap.id,
            userEmail: user.email || "",
            userName:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.username ||
              "",
            initialAmount: user.initialBalance || 0,
            targetAmount: target,
            botHours: hours,
            type: "bot_trading",
            timestamp: nowTs,
            status: "trading",
            botExpiresAt,
            note: "Auto-activated after analysing + grace period",
          });
        }

        activatedCount++;
        console.log(
          `[autoActivatePendingBots] Activated bot for ${user.email || docSnap.id}`,
        );
      }

      console.log(
        `[autoActivatePendingBots] Total activated: ${activatedCount}`,
      );
      return null;
    } catch (err) {
      console.error("[autoActivatePendingBots]", err);
      throw err;
    }
  });

// ═════════════════════════════════════════════════════════════════════════════
// FUNCTION 2 — applyBalanceIncrements (v1 scheduled, Spark-compatible)
// Runs every 1 minute automatically via Firebase, no cron-job.org needed
// ═════════════════════════════════════════════════════════════════════════════
exports.applyBalanceIncrements = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context) => {
    const now = Date.now();
    let appliedCount = 0;
    let expiredCount = 0;

    try {
      const snap = await db
        .collection("users")
        .where("botStatus", "==", "activated")
        .get();

      if (snap.empty) {
        console.log("[applyBalanceIncrements] No active bots");
        return null;
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

          // Update adminTransactions
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
          console.log(
            `[EXPIRE] ${user.email || uid}: final balance $${formatMoney(finalBalance)}` +
              (residual > 0
                ? `, residual $${formatMoney(residual)}`
                : ", no residual"),
          );
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

          console.log(
            `[APPLY] ${user.email || uid}: ${due.length} drop(s), +$${formatMoney(totalIncrease)}, balance → $${formatMoney(newBalance)}`,
          );
        });

        appliedCount++;
      }

      console.log(
        `[applyBalanceIncrements] Applied: ${appliedCount}, Expired: ${expiredCount}`,
      );
      return null;
    } catch (err) {
      console.error("[applyBalanceIncrements]", err);
      throw err;
    }
  });

// ═════════════════════════════════════════════════════════════════════════════
// FUNCTION 3 — onUserUpdated (Firestore trigger, v1)
// ═════════════════════════════════════════════════════════════════════════════
exports.onUserUpdated = functions.firestore
  .document("users/{uid}")
  .onWrite(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const uid = context.params.uid;

    if (
      !before ||
      !after ||
      !after.pendingTarget ||
      after.botStatus === "activated"
    )
      return null;

    const now = Date.now();
    const analysingExpMs = after.analysingExpiresAt?.toMillis?.() || 0;
    if (now <= analysingExpMs) return null;

    const gracePeriodMs =
      after.gracePeriodMs || (2 + Math.random() * 3) * 60 * 1000;
    if (now < analysingExpMs + gracePeriodMs) return null;

    const hours = after.botHours || 1;
    const target = after.targetAmount || 0;
    const nowTs = admin.firestore.Timestamp.now();
    const botExpiresAt = admin.firestore.Timestamp.fromMillis(
      now + hours * 3600 * 1000,
    );
    const schedule = generateIncrementSchedule(target, hours);

    try {
      await db.collection("users").doc(uid).update({
        botStatus: "activated",
        botActive: true,
        botActivatedAt: nowTs,
        botExpiresAt,
        pendingTarget: false,
        gracePeriodMs: admin.firestore.FieldValue.delete(),
        lastTargetSetAt: nowTs,
        incrementSchedule: schedule,
        incrementScheduleStartMs: now,
        incrementsApplied: 0,
      });

      const txnSnap = await db
        .collection("adminTransactions")
        .where("userId", "==", uid)
        .where("type", "==", "bot_trading")
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      if (!txnSnap.empty) {
        await txnSnap.docs[0].ref.update({
          status: "trading",
          botExpiresAt,
          botActivatedAt: nowTs,
          note: "Auto-activated via onUserUpdated trigger",
          updatedAt: nowTs,
        });
      } else {
        await db.collection("adminTransactions").add({
          userId: uid,
          userEmail: after.email || "",
          userName:
            `${after.firstName || ""} ${after.lastName || ""}`.trim() ||
            after.username ||
            "",
          initialAmount: after.initialBalance || 0,
          targetAmount: target,
          botHours: hours,
          type: "bot_trading",
          timestamp: nowTs,
          status: "trading",
          botExpiresAt,
          note: "Auto-activated via onUserUpdated trigger",
        });
      }

      console.log(`[onUserUpdated] Activated bot for ${uid}`);
      return null;
    } catch (err) {
      console.error(`[onUserUpdated] Error for ${uid}:`, err);
      return null;
    }
  });
