import admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.replace(/^["']|["']$/g, "");
      privateKey = privateKey.replace(/\\n/g, "\n");
    }
    if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
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

function generateIncrementSchedule(targetAmount, totalHours) {
  if (!targetAmount || targetAmount <= 0 || !totalHours || totalHours <= 0) return [];
  const totalMs = totalHours * 3600 * 1000;
  const chunks = [];
  let remaining = Math.round(targetAmount * 100) / 100;
  let sevenHundredCount = 0;
  while (remaining > 0.005) {
    let maxAllowed = Math.min(remaining, 700);
    if (sevenHundredCount >= 2) maxAllowed = Math.min(maxAllowed, 699);
    let chunk;
    const roll = Math.random();
    if (roll < 0.35) chunk = 50 + Math.random() * 150;
    else if (roll < 0.75) chunk = 300 + Math.random() * 200;
    else chunk = 600 + Math.random() * 100;
    chunk = Math.round(Math.min(chunk, maxAllowed));
    if (remaining - chunk < 50 && remaining - chunk > 0) chunk = remaining;
    if (chunk === 700) sevenHundredCount++;
    chunks.push(chunk);
    remaining = Math.round((remaining - chunk) * 100) / 100;
  }
  if (chunks.length === 0) return [];
  const n = chunks.length;
  const startBuffer = 2 * 60 * 1000;
  const endBuffer = Math.min(totalMs - 2 * 60 * 1000, Math.max(startBuffer + 60000, totalMs - 2 * 60 * 1000));
  const usableMs = endBuffer - startBuffer;
  const slotSize = usableMs / n;
  const increments = chunks.map((amount, i) => {
    const slotStart = startBuffer + i * slotSize;
    const jitter = (Math.random() - 0.5) * slotSize * 0.4;
    const offsetMs = Math.round(Math.max(startBuffer, Math.min(endBuffer, slotStart + jitter)));
    return { amount, offsetMs };
  });
  increments.sort((a, b) => a.offsetMs - b.offsetMs);
  for (let i = 1; i < increments.length; i++) {
    const minNext = increments[i - 1].offsetMs + 60000;
    if (increments[i].offsetMs < minNext) increments[i].offsetMs = minNext;
  }
  for (let i = increments.length - 1; i >= 0; i--) {
    const cap = endBuffer - (increments.length - 1 - i) * 60000;
    if (increments[i].offsetMs > cap) increments[i].offsetMs = cap;
  }
  return increments;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { uid, targetAmount, botHours } = req.body;

  if (!uid || !targetAmount || targetAmount <= 0 || !botHours || botHours <= 0) {
    return res.status(400).json({ error: "Missing or invalid parameters" });
  }

  const now = Date.now();
  const nowTs = admin.firestore.Timestamp.now();
  const botExpiresAt = admin.firestore.Timestamp.fromMillis(now + botHours * 3600 * 1000);
  const schedule = generateIncrementSchedule(targetAmount, botHours);

  try {
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
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
        userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "",
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
    console.error("[activate-bot-directly] ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
}