import { collection, getDocs, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export const recoverAndRestore = async () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMs = startOfDay.getTime();

  console.log("🔍 Searching for today's successful withdrawals...");

  const usersSnap = await getDocs(collection(db, "users"));
  let totalRestored = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const userData = userDoc.data();

    // Fetch ALL transactions for this user (no composite query needed)
    const txnSnap = await getDocs(collection(db, "users", uid, "transactions"));
    
    const updates = {};
    let count = 0;

    txnSnap.docs.forEach((t) => {
      const tData = t.data();
      const ts = tData.timestamp?.toMillis?.() || 0;
      const type = tData.type;
      const status = tData.status;

      // Filter client-side
      if (
        type === "withdrawal" &&
        status === "successful" &&
        ts >= startMs
      ) {
        updates[`withdrawalHistory.${t.id}`] = {
          amount: tData.amount || 0,
          timestamp: tData.timestamp,
          reversed: false,
        };
        count++;
      }
    });

    if (count > 0) {
      await updateDoc(doc(db, "users", uid), updates);
      console.log(`✅ ${userData.email || uid}: restored ${count} withdrawal(s)`);
      totalRestored += count;
    }
  }

  console.log(`\n🎉 Done! Restored ${totalRestored} total withdrawals.`);
  alert(`Recovery complete! Restored ${totalRestored} withdrawals. Check console for details.`);
  return totalRestored;
};