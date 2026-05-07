const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  Timestamp,
  FieldValue,
} = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

function formatMoney(val) {
  if (!val && val !== 0) return "0.00";
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return "0.00";
  const str = num.toFixed(10);
  const [intPart, decPart] = str.split(".");
  return `${intPart}.${decPart ? decPart.substring(0, 2) : "00"}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// generateIncrementSchedule
//
// KEY DESIGN:
//   • Chunks are placed from  startBuffer (2 min in)
//                         to  endBuffer   (2 min before expiry)
//   • This covers ~99% of the trading window, so by the time the bot expires
//     every chunk has already fired naturally — no big lump at the end.
//   • Each chunk: $50–$700.  All chunks sum exactly to targetAmount.
//   • Slots are evenly spaced with ±20% jitter so drops look organic.
//   • Minimum 60-second gap between consecutive drops.
//
// FIX: endBuffer previously used Math.max (wrong) — now uses Math.min (correct).
//      This ensures the last drop is capped 2 min BEFORE expiry, not pushed past it.
// ─────────────────────────────────────────────────────────────────────────────
function generateIncrementSchedule(targetAmount, totalHours) {
  if (!targetAmount || targetAmount <= 0 || !totalHours || totalHours <= 0)
    return [];

  const totalMs = totalHours * 3600 * 1000;

  // ── 1. Build chunk amounts ────────────────────────────────────────────────
  const chunks = [];
  let remaining = Math.round(targetAmount * 100) / 100;

  while (remaining > 0.005) {
    const maxChunk = Math.min(remaining, 700);
    const minChunk = Math.min(remaining, 50);
    let chunk;
    if (maxChunk <= 50.005) {
      chunk = maxChunk; // tail — take the exact remainder
    } else {
      chunk =
        Math.round((minChunk + Math.random() * (maxChunk - minChunk)) * 100) /
        100;
    }
    chunks.push(chunk);
    remaining = Math.round((remaining - chunk) * 100) / 100;
  }

  if (chunks.length === 0) return [];

  const n = chunks.length;

  // ── 2. Time boundaries ────────────────────────────────────────────────────
  // Start 2 min into the window, end 2 min before expiry.
  // FIXED: endBuffer uses Math.min so it is always BEFORE totalMs, never after.
  const startBuffer = 2 * 60 * 1000; // 2 min from start
  const endBuffer = Math.min(
    totalMs - 2 * 60 * 1000, // 2 min before end
    Math.max(startBuffer + 60000, totalMs - 2 * 60 * 1000),
  );
  const usableMs = endBuffer - startBuffer;
  const slotSize = usableMs / n;

  // ── 3. Place each chunk in its slot with jitter ───────────────────────────
  const increments = chunks.map((amount, i) => {
    const slotStart = startBuffer + i * slotSize;
    // jitter: ±20% of slot, clamped to [startBuffer, endBuffer]
    const jitter = (Math.random() - 0.5) * slotSize * 0.4;
    const offsetMs = Math.round(
      Math.max(startBuffer, Math.min(endBuffer, slotStart + jitter)),
    );
    return { amount, offsetMs };
  });

  // ── 4. Sort & enforce minimum 60-second spacing ───────────────────────────
  increments.sort((a, b) => a.offsetMs - b.offsetMs);

  for (let i = 1; i < increments.length; i++) {
    const minNext = increments[i - 1].offsetMs + 60000;
    if (increments[i].offsetMs < minNext) {
      increments[i].offsetMs = minNext;
    }
  }

  // ── 5. Safety: if spacing pushed any entry past endBuffer, clamp back ─────
  for (let i = increments.length - 1; i >= 0; i--) {
    const cap = endBuffer - (increments.length - 1 - i) * 60000;
    if (increments[i].offsetMs > cap) increments[i].offsetMs = cap;
  }

  return increments;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION 1 — autoActivatePendingBots  (every 1 minute)
// ─────────────────────────────────────────────────────────────────────────────
exports.autoActivatePendingBots = onSchedule("every 1 minutes", async () => {
  const now = Date.now();
  try {
    const snap = await db
      .collection("users")
      .where("pendingTarget", "==", true)
      .get();
    if (snap.empty) return;

    const batch = db.batch();
    let count = 0;

    for (const docSnap of snap.docs) {
      const user = docSnap.data();
      const analysingExpMs = user.analysingExpiresAt?.toMillis?.() || 0;
      if (now <= analysingExpMs) continue;

      // Assign 2–5 min grace period if not yet set
      let gracePeriodMs = user.gracePeriodMs;
      if (!gracePeriodMs) {
        gracePeriodMs = (2 + Math.random() * 3) * 60 * 1000;
        await docSnap.ref.update({ gracePeriodMs });
        continue;
      }
      if (now < analysingExpMs + gracePeriodMs) continue;

      const hours = user.botHours || 1;
      const target = user.targetAmount || 0;
      const nowTs = Timestamp.now();
      const botExpiresAt = Timestamp.fromMillis(now + hours * 3600 * 1000);

      // Increments spread across full window — nothing left to flush at end
      const schedule = generateIncrementSchedule(target, hours);

      batch.update(docSnap.ref, {
        botStatus: "activated",
        botActive: true,
        botActivatedAt: nowTs,
        botExpiresAt,
        pendingTarget: false,
        gracePeriodMs: FieldValue.delete(),
        lastTargetSetAt: nowTs,
        incrementSchedule: schedule,
        incrementScheduleStartMs: now,
        incrementsApplied: 0,
      });

      const txnRef = db.collection("adminTransactions").doc();
      batch.set(txnRef, {
        userId: docSnap.id,
        userEmail: user.email || "",
        userName:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.username ||
          "",
        initialAmount: user.initialBalance || 0,
        targetAmount: target,
        botHours: hours,
        type: "bot_trading_activated",
        timestamp: nowTs,
        status: "trading",
        botExpiresAt,
      });
      count++;
    }

    if (count > 0) await batch.commit();
    console.log(`[autoActivatePendingBots] Activated ${count} bot(s).`);
  } catch (err) {
    console.error("[autoActivatePendingBots]", err);
    throw err;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION 2 — applyBalanceIncrements  (every 1 minute)
//
// During trading:  apply any chunks whose offsetMs has elapsed.
// On expiry:       because increments were spread to 2 min before expiry,
//                  any remaining amount here is only a tiny rounding leftover.
//                  We still apply it so the balance is mathematically exact,
//                  but it will never be a large "surprise" drop.
// ─────────────────────────────────────────────────────────────────────────────
exports.applyBalanceIncrements = onSchedule("every 1 minutes", async () => {
  const now = Date.now();
  try {
    const snap = await db
      .collection("users")
      .where("botStatus", "==", "activated")
      .get();
    if (snap.empty) return;

    for (const docSnap of snap.docs) {
      const user = docSnap.data();
      const uid = docSnap.id;
      const expMs = user.botExpiresAt?.toMillis?.() || 0;
      const schedule = user.incrementSchedule || [];
      const startMs = user.incrementScheduleStartMs || 0;
      const appliedCount = user.incrementsApplied || 0;

      // ── BOT EXPIRED ───────────────────────────────────────────────────────
      // Because we spread drops to 2 min before expiry, `remaining` here is
      // either empty or contains only a very small tail (cents, not hundreds).
      if (now > expMs) {
        const remaining = schedule.slice(appliedCount);
        const residual = remaining.reduce((s, d) => s + d.amount, 0);

        // Guarantee exact final balance = initialBalance + targetAmount
        const finalBalance = parseFloat(
          ((user.initialBalance || 0) + (user.targetAmount || 0)).toFixed(2),
        );

        await docSnap.ref.update({
          botStatus: "disabled",
          botActive: false,
          balance: finalBalance,
          incrementsApplied: schedule.length,
        });

        // Write residual as one small transaction (if anything left at all)
        if (residual > 0) {
          await db
            .collection("users")
            .doc(uid)
            .collection("transactions")
            .doc()
            .set({
              type: "solana",
              amount: residual,
              source: "omnidev_bot",
              status: "completed",
              timestamp: Timestamp.now(),
              description: `OmniDev final balance adjustment +$${formatMoney(residual)}`,
            });
        }

        await db
          .collection("adminTransactions")
          .doc()
          .set({
            userId: uid,
            userEmail: user.email || "",
            userName:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.username ||
              "",
            initialAmount: user.initialBalance || 0,
            targetAmount: user.targetAmount || 0,
            finalBalance,
            botHours: user.botHours || 0,
            type: "bot_trading_disabled",
            timestamp: Timestamp.now(),
            status: "completed",
          });

        console.log(
          `[EXPIRE] ${user.email}: final balance $${formatMoney(finalBalance)}` +
            (residual > 0
              ? `, tiny residual $${formatMoney(residual)}`
              : ", no residual"),
        );
        continue;
      }

      // ── BOT STILL ACTIVE — apply chunks whose time has come ──────────────
      if (appliedCount >= schedule.length) continue;

      const elapsedMs = now - startMs;
      const due = schedule
        .slice(appliedCount)
        .filter((inc) => elapsedMs >= inc.offsetMs);
      if (due.length === 0) continue;

      await db.runTransaction(async (tx) => {
        const freshDoc = await tx.get(docSnap.ref);
        const freshData = freshDoc.data();
        // Guard against double-apply
        if ((freshData.incrementsApplied || 0) !== appliedCount) return;

        const totalIncrease = due.reduce((s, inc) => s + inc.amount, 0);
        const currentBalance =
          freshData.balance || freshData.initialBalance || 0;
        const newBalance = parseFloat(
          (currentBalance + totalIncrease).toFixed(2),
        );

        tx.update(docSnap.ref, {
          balance: newBalance,
          incrementsApplied: appliedCount + due.length,
        });

        for (const inc of due) {
          const txnRef = db
            .collection("users")
            .doc(uid)
            .collection("transactions")
            .doc();
          tx.set(txnRef, {
            type: "solana",
            amount: inc.amount,
            source: "omnidev_bot",
            status: "completed",
            timestamp: Timestamp.now(),
            description: `OmniDev trading profit +$${formatMoney(inc.amount)}`,
          });
        }

        console.log(
          `[APPLY] ${user.email}: ${due.length} drop(s), +$${formatMoney(totalIncrease)}, balance → $${formatMoney(newBalance)}`,
        );
      });
    }
  } catch (err) {
    console.error("[applyBalanceIncrements]", err);
    throw err;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTION 3 — onUserUpdated  (Firestore trigger)
// Instantly activates if analysing was already done when target was set.
// ─────────────────────────────────────────────────────────────────────────────
exports.onUserUpdated = onDocumentWritten("users/{uid}", async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  const uid = event.params.uid;

  if (
    !before ||
    !after ||
    !after.pendingTarget ||
    after.botStatus === "activated"
  )
    return;

  const now = Date.now();
  const analysingExpMs = after.analysingExpiresAt?.toMillis?.() || 0;
  if (now <= analysingExpMs) return;

  const gracePeriodMs =
    after.gracePeriodMs || (2 + Math.random() * 3) * 60 * 1000;
  if (now < analysingExpMs + gracePeriodMs) return;

  const hours = after.botHours || 1;
  const target = after.targetAmount || 0;
  const nowTs = Timestamp.now();
  const botExpiresAt = Timestamp.fromMillis(now + hours * 3600 * 1000);

  // Same evenly-spread schedule
  const schedule = generateIncrementSchedule(target, hours);

  try {
    await db.collection("users").doc(uid).update({
      botStatus: "activated",
      botActive: true,
      botActivatedAt: nowTs,
      botExpiresAt,
      pendingTarget: false,
      gracePeriodMs: FieldValue.delete(),
      lastTargetSetAt: nowTs,
      incrementSchedule: schedule,
      incrementScheduleStartMs: now,
      incrementsApplied: 0,
    });

    await db
      .collection("adminTransactions")
      .doc()
      .set({
        userId: uid,
        userEmail: after.email || "",
        userName:
          `${after.firstName || ""} ${after.lastName || ""}`.trim() ||
          after.username ||
          "",
        initialAmount: after.initialBalance || 0,
        targetAmount: target,
        botHours: hours,
        type: "bot_trading_activated",
        timestamp: nowTs,
        status: "trading",
        botExpiresAt,
      });

    console.log(`[onUserUpdated] Activated bot for ${uid}`);
  } catch (err) {
    console.error(`[onUserUpdated] Error for ${uid}:`, err);
  }
});
