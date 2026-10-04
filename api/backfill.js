// api/backfill.js — TEMPORARY. Deploy, visit the URL ONCE with your secret,
// confirm "Backfilled ...", then DELETE this file from your project.
import admin from "firebase-admin";

if (!admin.apps.length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/^[\"']|[\"']$/g, "");
    privateKey = privateKey.replace(/\\n/g, "\n");
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();
const CRON_SECRET = process.env.CRON_SECRET || "omnidev-cron-default-CHANGE-ME";

export default async function handler(req, res) {
  const secret = req.headers["x-cron-secret"] || req.query.secret;
  if (secret !== CRON_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const snap = await db
      .collection("users")
      .where("botStatus", "==", "activated")
      .get();

    let updated = 0;
    for (const d of snap.docs) {
      const u = d.data();
      const sched = u.incrementSchedule || [];
      const applied = u.incrementsApplied || 0;
      const start = u.incrementScheduleStartMs || 0;

      if (applied < sched.length && start) {
        await d.ref.update({
          nextIncrementAt: admin.firestore.Timestamp.fromMillis(
            start + sched[applied].offsetMs,
          ),
        });
        updated++;
      }
    }

    return res.status(200).json({
      status: "ok",
      backfilled: updated,
      activeBots: snap.size,
      note: "Now DELETE api/backfill.js from your project.",
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
}