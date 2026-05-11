const admin = require("firebase-admin");

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // Handle private key: strip surrounding quotes, convert \n to actual newlines
    if (privateKey) {
      // Remove surrounding quotes if present
      privateKey = privateKey.replace(/^["']|["']$/g, "");
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

module.exports = async function handler(req, res) {
  try {
    const secret = req.headers["x-cron-secret"] || req.query.secret;
    if (secret !== CRON_SECRET) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const now = Date.now();
    let activatedCount = 0;
    const results = [];

    const snap = await db
      .collection("users")
      .where("pendingTarget", "==", true)
      .get();

    if (snap.empty) {
      return res.status(200).json({
        status: "ok",
        activated: 0,
        message: "No pending bots",
      });
    }

    for (const docSnap of snap.docs) {
      const user = docSnap.data();
      const analysingExpMs = user.analysingExpiresAt?.toMillis?.() || 0;
      if (now <= analysingExpMs) continue;

      let gracePeriodMs = user.gracePeriodMs;
      if (!gracePeriodMs) {
        gracePeriodMs = (2 + Math.random() * 3) * 60 * 1000;
        await docSnap.ref.update({ gracePeriodMs });
        results.push({
          userId: docSnap.id,
          action: "grace_period_set",
        });
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
            (user.firstName || "") + " " + (user.lastName || "").trim() ||
            user.username ||
            "",
          initialAmount: user.initialBalance || 0,
          targetAmount: target,
          botHours: hours,
          type: "bot_trading",
          timestamp: nowTs,
          status: "trading",
          botExpiresAt,
        });
      }

      activatedCount++;
      results.push({
        userId: docSnap.id,
        action: "activated",
        target: formatMoney(target),
        hours,
      });
    }

    res.status(200).json({
      status: "ok",
      activated: activatedCount,
      checked: snap.docs.length,
      results,
    });
  } catch (err) {
    console.error("[activate-bots] ERROR:", err.message);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
