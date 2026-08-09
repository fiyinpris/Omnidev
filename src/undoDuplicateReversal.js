import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export const findAndFixDuplicateReversal = async (userEmail) => {
  const normalizedEmail = userEmail.toLowerCase().trim();

  // 1. Find the user
  const usersSnap = await getDocs(collection(db, "users"));
  const userDoc = usersSnap.docs.find((d) => {
    const data = d.data();
    return (data.email || "").toLowerCase().trim() === normalizedEmail;
  });

  if (!userDoc) {
    console.log("❌ User not found:", userEmail);
    return null;
  }

  const uid = userDoc.id;
  const userData = userDoc.data();
  const exactEmail = userData.email;

  // 2. Scan user's transaction history for recent reversals
  const txnSnap = await getDocs(collection(db, "users", uid, "transactions"));
  const now = Date.now();
  const twoDays = 48 * 60 * 60 * 1000;

  const reversalTxns = txnSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((t) => {
      const isReversal =
        t.type === "reversal" ||
        (t.description || "").toLowerCase().includes("reversal");
      const ts = t.timestamp?.toMillis?.() || t.timestamp?.seconds * 1000 || 0;
      return isReversal && now - ts < twoDays;
    })
    .map((t) => ({
      id: t.id,
      amount: t.amount || 0,
      timestamp: t.timestamp,
      source: "transaction",
      status: t.status || "completed",
    }))
    .sort((a, b) => {
      const aTime = a.timestamp?.toMillis?.() || 0;
      const bTime = b.timestamp?.toMillis?.() || 0;
      return bTime - aTime; // newest first
    });

  console.log(`Found ${reversalTxns.length} recent reversal transaction(s)`);

  // 3. Group by amount to find duplicates in transactions
  const txnAmountMap = {};
  reversalTxns.forEach((t) => {
    const amt = Math.round(t.amount * 100) / 100;
    if (!txnAmountMap[amt]) txnAmountMap[amt] = [];
    txnAmountMap[amt].push(t);
  });

  const txnDuplicates = Object.entries(txnAmountMap).filter(
    ([, arr]) => arr.length >= 2,
  );

  if (txnDuplicates.length > 0) {
    const [amountStr, dupes] = txnDuplicates[0];
    console.log(
      `⚠️ Duplicate reversal transactions: $${amountStr} × ${dupes.length}`,
    );
    return {
      uid,
      userEmail: exactEmail,
      duplicateAmount: parseFloat(amountStr),
      reversals: dupes,
    };
  }

  // 4. Fallback: check scheduledReversals
  const revQuery = query(
    collection(db, "scheduledReversals"),
    where("userEmail", "==", exactEmail),
  );
  const revSnap = await getDocs(revQuery);
  const reversals = revSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    source: "scheduled",
  }));

  const revAmountMap = {};
  reversals.forEach((r) => {
    const amt = Math.round((r.amount || 0) * 100) / 100;
    if (!revAmountMap[amt]) revAmountMap[amt] = [];
    revAmountMap[amt].push(r);
  });

  const revDuplicates = Object.entries(revAmountMap).filter(
    ([, arr]) => arr.length >= 2,
  );

  if (revDuplicates.length > 0) {
    const [amountStr, dupes] = revDuplicates[0];
    console.log(
      `⚠️ Duplicate scheduled reversals: $${amountStr} × ${dupes.length}`,
    );
    return {
      uid,
      userEmail: exactEmail,
      duplicateAmount: parseFloat(amountStr),
      reversals: dupes,
    };
  }

  console.log("✅ No duplicate reversals found.");
  return null;
};

export const undoOneReversal = async (userEmail, docId) => {
  console.log(`\n🛠️ Undoing reversal ${docId} for ${userEmail}...`);

  // Find user
  const usersSnap = await getDocs(collection(db, "users"));
  const userDoc = usersSnap.docs.find((d) => {
    const data = d.data();
    return (
      (data.email || "").toLowerCase().trim() === userEmail.toLowerCase().trim()
    );
  });

  if (!userDoc) {
    console.log("❌ User not found.");
    return false;
  }

  const uid = userDoc.id;
  const userData = userDoc.data();

  // Try to find docId in user's transactions first
  const txnRef = doc(db, "users", uid, "transactions", docId);
  const txnSnap = await getDoc(txnRef);

  if (txnSnap.exists()) {
    // It's a transaction duplicate
    const txnData = txnSnap.data();
    const amount = txnData.amount || 0;

    if (amount <= 0) {
      console.log("❌ Invalid transaction amount.");
      return false;
    }

    const currentBalance = userData.balance || 0;
    const newBalance = Math.max(0, currentBalance - amount);

    // Subtract from balance
    await updateDoc(doc(db, "users", uid), { balance: newBalance });

    // Delete the duplicate transaction
    await deleteDoc(txnRef);

    // Cancel any matching scheduled reversal
    const revQuery = query(
      collection(db, "scheduledReversals"),
      where("userEmail", "==", userData.email),
      where("amount", "==", amount),
    );
    const revSnap = await getDocs(revQuery);
    const matchingRevs = revSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

    if (matchingRevs.length > 0) {
      const rev = matchingRevs[0];
      if (rev.status === "pending") {
        await deleteDoc(doc(db, "scheduledReversals", rev.id));
        console.log("   ✅ Deleted pending scheduled reversal.");
      } else {
        await updateDoc(doc(db, "scheduledReversals", rev.id), {
          status: "cancelled",
          cancelledAt: Timestamp.now(),
          note: "Cancelled by admin - duplicate reversal undone",
        });
        console.log("   ✅ Marked scheduled reversal as cancelled.");
      }
    }

    // Restore withdrawalHistory so it can be reversed again if needed
    if (userData.withdrawalHistory) {
      const match = Object.entries(userData.withdrawalHistory).find(
        ([, h]) => h.reversed && Math.abs((h.amount || 0) - amount) < 0.01,
      );
      if (match) {
        await updateDoc(doc(db, "users", uid), {
          [`withdrawalHistory.${match[0]}.reversed`]: false,
        });
        console.log("   ✅ Restored withdrawal to Available for Reversal.");
      }
    }

    console.log(
      `\n🎉 Done! Subtracted $${amount} from balance. New balance: $${newBalance}.`,
    );
    return { success: true, amountRemoved: amount, newBalance };
  }

  // Fallback: treat docId as a scheduledReversal ID
  const revRef = doc(db, "scheduledReversals", docId);
  const revSnap = await getDoc(revRef);

  if (!revSnap.exists()) {
    console.log("❌ Document not found in transactions or scheduledReversals.");
    return false;
  }

  const reversal = revSnap.data();
  const amount = reversal.amount || 0;

  if (amount <= 0) {
    console.log("❌ Invalid reversal amount.");
    return false;
  }

  const currentBalance = userData.balance || 0;
  const newBalance = Math.max(0, currentBalance - amount);

  await updateDoc(doc(db, "users", uid), { balance: newBalance });

  if (reversal.status === "pending") {
    await deleteDoc(revRef);
  } else {
    await updateDoc(revRef, {
      status: "cancelled",
      cancelledAt: Timestamp.now(),
      note: "Cancelled by admin - duplicate reversal",
    });
  }

  // Delete matching transaction
  const txnSnap2 = await getDocs(collection(db, "users", uid, "transactions"));
  const matchingTxns = txnSnap2.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((t) => {
      const ts = t.timestamp?.toMillis?.() || 0;
      return (
        (t.type === "reversal" ||
          (t.description || "").toLowerCase().includes("reversal")) &&
        Math.abs((t.amount || 0) - amount) < 0.01 &&
        now - ts < twoDays
      );
    })
    .sort((a, b) => {
      const aTime = a.timestamp?.toMillis?.() || 0;
      const bTime = b.timestamp?.toMillis?.() || 0;
      return bTime - aTime;
    });

  if (matchingTxns.length > 0) {
    await deleteDoc(doc(db, "users", uid, "transactions", matchingTxns[0].id));
    console.log("   ✅ Deleted matching reversal transaction.");
  }

  console.log(
    `\n🎉 Done! Subtracted $${amount} from balance. New balance: $${newBalance}.`,
  );
  return { success: true, amountRemoved: amount, newBalance };
};
