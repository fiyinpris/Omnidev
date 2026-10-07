const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

// ── CONFIG ───────────────────────────────────────────────────────────────────
// Run: firebase functions:config:set cron.secret="your-secret-here"
const CRON_SECRET =
  functions.config().cron?.secret || "omnidev-cron-default-CHANGE-ME";

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function formatMoney(val) {
  if (!val && val !== 0) return "0.00";
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return "0.00";
  const str = num.toFixed(10);
  const [intPart, decPart] = str.split(".");
  return `${intPart}.${decPart ? decPart.substring(0, 2) : "00"}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// GENERATE INCREMENT SCHEDULE
// ═════════════════════════════════════════════════════════════════════════════

function generateIncrementSchedule(targetAmount, totalHours) {
  if (!targetAmount || targetAmount <= 0 || !totalHours || totalHours <= 0) {
    return [];
  }

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
// HELPER — GET NEXT INCREMENT TIMESTAMP
// ═════════════════════════════════════════════════════════════════════════════

function getNextIncrementTimestamp(schedule, appliedCount, startMs) {
  if (
    !schedule ||
    schedule.length === 0 ||
    appliedCount >= schedule.length ||
    !startMs
  ) {
    return admin.firestore.FieldValue.delete();
  }

  return admin.firestore.Timestamp.fromMillis(
    startMs + schedule[appliedCount].offsetMs,
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// FUNCTION 1 — autoActivatePendingBots
// Runs every 1 minute. Only scans PENDING users (not all users).
// QUOTA FIX: now stamps `nextIncrementAt` so the increment cron never has to
// scan all activated users.
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
            `[autoActivatePendingBots] Set grace period for ${
              user.email || docSnap.id
            }`,
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

        // ── QUOTA FIX: stamp when the first chunk is due ──────────────────
        const nextIncrementAt =
          schedule.length > 0
            ? admin.firestore.Timestamp.fromMillis(now + schedule[0].offsetMs)
            : admin.firestore.FieldValue.delete();

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
          nextIncrementAt,
        });

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
          `[autoActivatePendingBots] Activated bot for ${
            user.email || docSnap.id
          }`,
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
// FUNCTION 2 — applyBalanceIncrements
//
// ★★★ THIS IS THE MAIN QUOTA FIX ★★★
//
// OLD (quota killer):
//   .where("botStatus", "==", "activated").get()
//   → read EVERY activated user every minute (1,440x/day)
//
// NEW:
//   Only reads bots that are actually EXPIRED or actually DUE right now,
//   plus a small capped backfill of legacy bots missing nextIncrementAt.
// ═════════════════════════════════════════════════════════════════════════════

exports.applyBalanceIncrements = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context) => {
    const now = Date.now();
    const nowTs = admin.firestore.Timestamp.now();
    let appliedCount = 0;
    let expiredCount = 0;
    let backfilledCount = 0;

    try {
      // ═══════════════════════════════════════════════════════════════════════
      // 1. FIND ONLY EXPIRED BOTS
      // ═══════════════════════════════════════════════════════════════════════

      const expiredSnap = await db
        .collection("users")
        .where("botStatus", "==", "activated")
        .where("botExpiresAt", "<=", nowTs)
        .limit(500)
        .get();

      // ═══════════════════════════════════════════════════════════════════════
      // 2. EXPIRE THEM
      // ═══════════════════════════════════════════════════════════════════════

      for (const docSnap of expiredSnap.docs) {
        const user = docSnap.data();
        const uid = docSnap.id;
        const schedule = user.incrementSchedule || [];
        const appliedCountUser = user.incrementsApplied || 0;

        const remaining = schedule.slice(appliedCountUser);
        const residual = remaining.reduce((sum, item) => sum + item.amount, 0);

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
              description: `OmniDev final balance adjustment +$${formatMoney(
                residual,
              )}`,
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
        console.log(
          `[EXPIRE] ${user.email || uid}: final balance $${formatMoney(
            finalBalance,
          )}${
            residual > 0
              ? `, residual $${formatMoney(residual)}`
              : ", no residual"
          }`,
        );
      }

      // ═══════════════════════════════════════════════════════════════════════
      // 3. FIND ONLY BOTS WHOSE NEXT INCREMENT IS DUE
      //    (was previously: read ALL activated users)
      // ═══════════════════════════════════════════════════════════════════════

      const dueSnap = await db
        .collection("users")
        .where("botStatus", "==", "activated")
        .where("nextIncrementAt", "<=", nowTs)
        .limit(500)
        .get();

      // ═══════════════════════════════════════════════════════════════════════
      // 4. PROCESS DUE BOTS
      // ═══════════════════════════════════════════════════════════════════════

      for (const docSnap of dueSnap.docs) {
        const uid = docSnap.id;

        await db.runTransaction(async (tx) => {
          const freshDoc = await tx.get(docSnap.ref);
          const freshData = freshDoc.data();

          if (!freshData) return;
          if (freshData.botStatus !== "activated") return;

          const schedule = freshData.incrementSchedule || [];
          const startMs = freshData.incrementScheduleStartMs || 0;
          const applied = freshData.incrementsApplied || 0;

          // Nothing left to process
          if (schedule.length === 0 || applied >= schedule.length) {
            tx.update(docSnap.ref, {
              nextIncrementAt: admin.firestore.FieldValue.delete(),
            });
            return;
          }

          const elapsedMs = now - startMs;
          const due = schedule
            .slice(applied)
            .filter((inc) => elapsedMs >= inc.offsetMs);

          if (due.length === 0) {
            // Safety: point at the next scheduled increment
            tx.update(docSnap.ref, {
              nextIncrementAt: getNextIncrementTimestamp(
                schedule,
                applied,
                startMs,
              ),
            });
            return;
          }

          const totalIncrease = due.reduce((sum, inc) => sum + inc.amount, 0);
          const currentBalance =
            freshData.balance || freshData.initialBalance || 0;
          const newBalance = parseFloat(
            (currentBalance + totalIncrease).toFixed(2),
          );
          const newApplied = applied + due.length;

          // ── QUOTA FIX: schedule the NEXT due time so this user is NOT
          //    read again until another increment is actually due ──────────
          const update = {
            balance: newBalance,
            incrementsApplied: newApplied,
          };

          if (newApplied < schedule.length) {
            update.nextIncrementAt = admin.firestore.Timestamp.fromMillis(
              startMs + schedule[newApplied].offsetMs,
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
              description: `OmniDev trading profit +$${formatMoney(inc.amount)}`,
            });
          }

          console.log(
            `[APPLY] ${freshData.email || uid}: ${
              due.length
            } drop(s), +$${formatMoney(totalIncrease)}, balance → $${formatMoney(
              newBalance,
            )}`,
          );
        });

        appliedCount++;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // 5. BACKFILL LEGACY BOTS (old bots missing nextIncrementAt)
      //    Capped at 100/minute so the first minutes after deploy don't
      //    create another huge read spike. Once stamped, they leave this
      //    query permanently.
      // ═══════════════════════════════════════════════════════════════════════

      const legacySnap = await db
        .collection("users")
        .where("botStatus", "==", "activated")
        .where("nextIncrementAt", "==", null)
        .limit(100)
        .get();

      for (const docSnap of legacySnap.docs) {
        const user = docSnap.data();
        const schedule = user.incrementSchedule || [];
        const startMs = user.incrementScheduleStartMs || 0;
        const applied = user.incrementsApplied || 0;

        const nothingToDo =
          schedule.length === 0 || !startMs || applied >= schedule.length;

        if (nothingToDo) {
          await docSnap.ref.update({
            nextIncrementAt: admin.firestore.FieldValue.delete(),
          });
          backfilledCount++;
          continue;
        }

        const nextTimestamp = admin.firestore.Timestamp.fromMillis(
          startMs + schedule[applied].offsetMs,
        );

        await docSnap.ref.update({ nextIncrementAt: nextTimestamp });
        backfilledCount++;

        console.log(
          `[BACKFILL] ${user.email || docSnap.id}: next increment ${nextTimestamp.toDate()}`,
        );
      }

      console.log(
        `[applyBalanceIncrements] Applied: ${appliedCount}, Expired: ${expiredCount}, Backfilled: ${backfilledCount}`,
      );
      return null;
    } catch (err) {
      console.error("[applyBalanceIncrements]", err);
      throw err;
    }
  });

// ═════════════════════════════════════════════════════════════════════════════
// FUNCTION 3 — onUserUpdated (Firestore trigger, safety net)
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
    ) {
      return null;
    }

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

    // ── QUOTA FIX: stamp first increment time here too ────────────────────
    const nextIncrementAt =
      schedule.length > 0
        ? admin.firestore.Timestamp.fromMillis(now + schedule[0].offsetMs)
        : admin.firestore.FieldValue.delete();

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
        nextIncrementAt,
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

// ═════════════════════════════════════════════════════════════════════════════
// FUNCTION 4 — activateBotDirectly (HTTP with CORS for re-activation)
// ═════════════════════════════════════════════════════════════════════════════

exports.activateBotDirectly = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { uid, targetAmount, botHours } = req.body;

  if (
    !uid ||
    !targetAmount ||
    targetAmount <= 0 ||
    !botHours ||
    botHours <= 0
  ) {
    res.status(400).json({ error: "Missing or invalid parameters" });
    return;
  }

  const now = Date.now();
  const nowTs = admin.firestore.Timestamp.now();
  const botExpiresAt = admin.firestore.Timestamp.fromMillis(
    now + botHours * 3600 * 1000,
  );
  const schedule = generateIncrementSchedule(targetAmount, botHours);

  // ── QUOTA FIX: stamp first increment time ──────────────────────────────
  const nextIncrementAt =
    schedule.length > 0
      ? admin.firestore.Timestamp.fromMillis(now + schedule[0].offsetMs)
      : admin.firestore.FieldValue.delete();

  try {
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = userDoc.data();
    const currentBalance = user.balance || user.initialBalance || 0;

    await userRef.update({
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
      nextIncrementAt,
      targetAmount: targetAmount,
      botHours: botHours,
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
        note: "Re-activated via admin dashboard",
        updatedAt: nowTs,
        targetAmount: targetAmount,
        botHours: botHours,
      });
    } else {
      await db.collection("adminTransactions").add({
        userId: uid,
        userEmail: user.email || "",
        userName:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.username ||
          "",
        initialAmount: currentBalance,
        targetAmount: targetAmount,
        botHours: botHours,
        type: "bot_trading",
        timestamp: nowTs,
        status: "trading",
        botExpiresAt,
        note: "Re-activated via admin dashboard",
      });
    }

    res.status(200).json({
      success: true,
      scheduleLength: schedule.length,
      botExpiresAt: botExpiresAt.toMillis(),
    });
  } catch (err) {
    console.error("[activateBotDirectly] Error:", err);
    res.status(500).json({ error: err.message });
  }
});
