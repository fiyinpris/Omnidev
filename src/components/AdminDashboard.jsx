import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import emailjs from "@emailjs/browser";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  getDoc,
  where,
} from "firebase/firestore";

const ADMIN_EMAIL = "fiyinolaleke@gmail.com";
const TXN_PAGE_SIZE = 25;

const fmt = (val) => {
  if (val === undefined || val === null) return "0.00";
  const n = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(n) || Object.is(n, -0)) return "0.00";
  const rounded = Math.round(n * 100) / 100;
  const s = rounded.toFixed(2);
  const [int, dec] = s.split(".");
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`;
};

const fmtDuration = (ms) => {
  if (!ms || ms <= 0) return "0m";
  const m = Math.floor(ms / 60000),
    h = Math.floor(m / 60),
    mins = m % 60;
  if (h > 0 && mins > 0) return `${h}h ${mins}m`;
  if (h > 0) return `${h}h`;
  return `${mins}m`;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const STATUS_COLORS = {
  analysing: {
    bg: "rgba(13,148,136,.15)",
    text: "#0d9488",
    label: "OmniDev Analysing",
  },
  scheduled: {
    bg: "rgba(245,158,11,.15)",
    text: "#f59e0b",
    label: "Scheduled",
  },
  trading: {
    bg: "rgba(34,197,94,.15)",
    text: "#22c55e",
    label: "Bot Trading Active",
  },
  disabled: {
    bg: "rgba(239,68,68,.15)",
    text: "#ef4444",
    label: "Bot Trading Disabled",
  },
  completed: {
    bg: "rgba(13,148,136,.15)",
    text: "#0d9488",
    label: "Completed",
  },
  wallet_failed: {
    bg: "rgba(239,68,68,.15)",
    text: "#ef4444",
    label: "Wallet Connection Failed",
  },
  processing: {
    bg: "rgba(13,148,136,.15)",
    text: "#0d9488",
    label: "Processing",
  },
  successful: {
    bg: "rgba(34,197,94,.15)",
    text: "#22c55e",
    label: "Successful",
  },
  failed: { bg: "rgba(239,68,68,0.15)", text: "#ef4444", label: "Failed" },
  Sent: { bg: "rgba(124,92,252,0.15)", text: "#a78bfa", label: "Sent" },
};

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("main");

  const [fundSel, setFundSel] = useState(null);
  const [fundAmt, setFundAmt] = useState("");
  const [anaHrs, setAnaHrs] = useState("0");
  const [anaMins, setAnaMins] = useState("45");
  const [fundLoading, setFundLoading] = useState(false);
  const [fundOk, setFundOk] = useState("");
  const [fundErr, setFundErr] = useState("");

  const [tgtSel, setTgtSel] = useState(null);
  const [tgtAmt, setTgtAmt] = useState("");
  const [botHrs, setBotHrs] = useState("1");
  const [botMins, setBotMins] = useState("0");
  const [tgtLoading, setTgtLoading] = useState(false);
  const [tgtOk, setTgtOk] = useState("");
  const [tgtErr, setTgtErr] = useState("");

  const [wfSel, setWfSel] = useState(null);
  const [wfNote, setWfNote] = useState("");
  const [wfLoading, setWfLoading] = useState(false);
  const [wfOk, setWfOk] = useState("");
  const [wfErr, setWfErr] = useState("");

  const [processingTxns, setProcessingTxns] = useState([]);
  const [procSel, setProcSel] = useState(null);
  const [procLoading, setProcLoading] = useState(false);
  const [procOk, setProcOk] = useState("");
  const [procErr, setProcErr] = useState("");

  const [revSel, setRevSel] = useState(null);
  const [revHrs, setRevHrs] = useState("0");
  const [revMins, setRevMins] = useState("30");
  const [revLoading, setRevLoading] = useState(false);
  const [revOk, setRevOk] = useState("");
  const [revErr, setRevErr] = useState("");
  const [pendingReversals, setPendingReversals] = useState([]);

  const [vsnDepositAmt, setVsnDepositAmt] = useState("");
  const [vsnDepositLoading, setVsnDepositLoading] = useState(false);
  const [vsnDepositOk, setVsnDepositOk] = useState("");
  const [vsnDepositErr, setVsnDepositErr] = useState("");

  const [txns, setTxns] = useState([]);
  const [txnPage, setTxnPage] = useState(1);
  const [txnLoadingMore, setTxnLoadingMore] = useState(false);
  const [txnFilterMonth, setTxnFilterMonth] = useState("all");
  const [txnFilterYear, setTxnFilterYear] = useState("all");
  const txnScrollRef = useRef(null);

  const [vsnSel, setVsnSel] = useState(null);
  const [vsnCode, setVsnCode] = useState("");
  const [vsnLoading, setVsnLoading] = useState(false);
  const [vsnOk, setVsnOk] = useState("");
  const [vsnErr, setVsnErr] = useState("");

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        navigate("/");
        return;
      }
      setAdminUser(user);
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!adminUser) return;
    const unsub = onSnapshot(collection(db, "users"), async (snap) => {
      const profSnap = await getDocs(collection(db, "profiles"));
      const profMap = {};
      profSnap.docs.forEach((d) => {
        profMap[d.id] = d.data();
      });
      const list = snap.docs.map((d) => {
        const data = d.data(),
          prof = profMap[d.id] || {};
        return {
          uid: d.id,
          email: data.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          username: prof.username || data.username || "",
          picture: prof.picture || null,
          balance: data.balance || 0,
          initialBalance: data.initialBalance || 0,
          botActive: data.botActive || false,
          botExpiresAt: data.botExpiresAt || null,
          analysingExpiresAt: data.analysingExpiresAt || null,
          scheduleActivateAt: data.scheduleActivateAt || null,
          botStatus: data.botStatus || "disabled",
          targetAmount: data.targetAmount || 0,
          botHours: data.botHours || 0,
          hasBeenFunded: data.hasBeenFunded || false,
          pendingTarget: data.pendingTarget || false,
          incrementSchedule: data.incrementSchedule || [],
          incrementScheduleStartMs: data.incrementScheduleStartMs || 0,
          incrementsApplied: data.incrementsApplied || 0,
          withdrawalStatus: data.withdrawalStatus || null,
          pendingWithdrawAmount: data.pendingWithdrawAmount || 0,
          pendingWithdrawWallet: data.pendingWithdrawWallet || "",
          vsn_required: data.vsn_required || false,
          vsn_verified: data.vsn_verified || false,
          vsn_code: data.vsn_code || "",
          walletConnectionFailed: data.walletConnectionFailed || false,
          withdrawalCompletedCount: data.withdrawalCompletedCount || 0,
          lastWithdrawnAmount: data.lastWithdrawnAmount || 0,
        };
      });
      setUsers(list);
      setFundSel((p) => (p ? list.find((u) => u.uid === p.uid) || p : null));
      setTgtSel((p) => (p ? list.find((u) => u.uid === p.uid) || p : null));
      setVsnSel((p) => (p ? list.find((u) => u.uid === p.uid) || p : null));
      setWfSel((p) => (p ? list.find((u) => u.uid === p.uid) || p : null));
      setRevSel((p) => (p ? list.find((u) => u.uid === p.uid) || p : null));
    });
    return () => unsub();
  }, [adminUser]);

  useEffect(() => {
    if (!adminUser || users.length === 0) return;
    const unsubs = [];
    const update = (uid, docs) => {
      setProcessingTxns((prev) => {
        const filtered = prev.filter((t) => t.uid !== uid);
        return [...filtered, ...docs];
      });
    };
    users.forEach((u) => {
      const txnRef = collection(db, "users", u.uid, "transactions");
      const unsub = onSnapshot(txnRef, (snap) => {
        const docs = snap.docs
          .filter((d) => {
            const data = d.data();
            return data.type === "withdrawal" && data.status === "processing";
          })
          .map((d) => ({
            uid: u.uid,
            txnId: d.id,
            userEmail: u.email,
            userName:
              `${u.firstName} ${u.lastName}`.trim() || u.username || u.email,
            userBalance: u.balance,
            ...d.data(),
            timestamp: d.data().timestamp?.toDate?.() || new Date(),
            failsAt: d.data().failsAt,
          }));
        update(u.uid, docs);
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach((u) => u());
  }, [adminUser, users]);

  useEffect(() => {
    if (!adminUser) return;
    const unsub = onSnapshot(
      query(
        collection(db, "scheduledReversals"),
        where("status", "==", "pending"),
      ),
      async (snap) => {
        const now = Date.now();
        const pending = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          firesAt: d.data().firesAt?.toMillis?.() || d.data().firesAt,
        }));
        setPendingReversals(
          pending.map((r) => ({
            revDocId: r.id,
            uid: r.userId,
            userEmail: r.userEmail,
            amount: r.amount,
            firesAt: r.firesAt,
          })),
        );
        for (const rev of pending) {
          if (rev.firesAt && now >= rev.firesAt) {
            try {
              const ts = Timestamp.now();
              const userRef = doc(db, "users", rev.userId);
              const userSnap = await getDoc(userRef);
              const currentBalance = userSnap.data()?.balance || 0;
              const newBalance = currentBalance + rev.amount;
              await updateDoc(userRef, { balance: newBalance });
              await setDoc(
                doc(collection(db, "users", rev.userId, "transactions")),
                {
                  type: "reversal",
                  amount: rev.amount,
                  status: "successful",
                  timestamp: ts,
                  description: `Reversal — $${fmt(rev.amount)} returned to your account`,
                },
              );
              await updateDoc(doc(db, "scheduledReversals", rev.id), {
                status: "completed",
                completedAt: ts,
              });
              await setDoc(doc(collection(db, "adminTransactions")), {
                userId: rev.userId,
                userEmail: rev.userEmail,
                userName: rev.userName,
                type: "reversal",
                amount: rev.amount,
                timestamp: ts,
                status: "completed",
                adminEmail: adminUser.email,
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
              });
              console.log(
                `Reversal executed: $${fmt(rev.amount)} for ${rev.userEmail}`,
              );
            } catch (e) {
              console.error("Reversal execution error:", e);
              try {
                await updateDoc(doc(db, "scheduledReversals", rev.id), {
                  status: "failed",
                  failedAt: Timestamp.now(),
                });
              } catch (err) {
                console.error("Failed to mark reversal as failed:", err);
              }
            }
          }
        }
      },
    );
    return () => unsub();
  }, [adminUser]);

  useEffect(() => {
    if (!adminUser) return;
    const unsub = onSnapshot(
      query(collection(db, "adminTransactions"), orderBy("timestamp", "desc")),
      (snap) =>
        setTxns(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            timestamp: d.data().timestamp?.toDate?.() || new Date(),
          })),
        ),
    );
    return () => unsub();
  }, [adminUser]);

  const getFilteredTxns = useCallback(
    () =>
      txns.filter((t) => {
        if (
          txnFilterYear !== "all" &&
          t.timestamp.getFullYear() !== parseInt(txnFilterYear)
        )
          return false;
        if (
          txnFilterMonth !== "all" &&
          t.timestamp.getMonth() !== parseInt(txnFilterMonth)
        )
          return false;
        return true;
      }),
    [txns, txnFilterYear, txnFilterMonth],
  );

  const handleTxnScroll = useCallback(() => {
    const el = txnScrollRef.current;
    if (!el || txnLoadingMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) {
      const filtered = getFilteredTxns();
      if (txnPage * TXN_PAGE_SIZE < filtered.length) {
        setTxnLoadingMore(true);
        setTimeout(() => {
          setTxnPage((p) => p + 1);
          setTxnLoadingMore(false);
        }, 600);
      }
    }
  }, [txnPage, txnLoadingMore, getFilteredTxns]);

  const handleFund = async () => {
    const amount = Math.round(parseFloat(fundAmt.trim()) * 100) / 100;
    if (!fundSel || isNaN(amount) || amount <= 0) {
      setFundErr("Select a user and enter a valid amount.");
      return;
    }
    const now = Timestamp.now();
    const anaMs =
      (parseInt(anaHrs) || 0) * 3600000 + (parseInt(anaMins) || 0) * 60000;
    if (anaMs <= 0) {
      setFundErr("Set an analysis duration (at least 1 minute).");
      return;
    }
    const anaExp = Timestamp.fromMillis(now.toMillis() + anaMs);
    setFundLoading(true);
    setFundErr("");
    setFundOk("");
    try {
      await updateDoc(doc(db, "users", fundSel.uid), {
        balance: amount,
        initialBalance: amount,
        hasBeenFunded: true,
        botActive: true,
        botStatus: "analysing",
        targetAmount: 0,
        botHours: 0,
        botActivatedAt: now,
        botExpiresAt: null,
        analysingExpiresAt: anaExp,
        scheduleActivateAt: null,
        lastFundedAt: now,
        lastFundedAmount: amount,
        pendingTarget: false,
        incrementSchedule: [],
        incrementScheduleStartMs: 0,
        incrementsApplied: 0,
        walletConnectionFailed: false,
      });
      await setDoc(doc(collection(db, "adminTransactions")), {
        userId: fundSel.uid,
        userEmail: fundSel.email,
        userName:
          `${fundSel.firstName} ${fundSel.lastName}`.trim() || fundSel.username,
        amount,
        type: "initial_fund",
        timestamp: now,
        status: "analysing",
        adminEmail: adminUser.email,
        analysingExpiresAt: anaExp,
        analysingDurationMs: anaMs,
      });
      await setDoc(doc(collection(db, "users", fundSel.uid, "transactions")), {
        type: "deposit",
        amount,
        source: "admin",
        status: "completed",
        timestamp: now,
        description: `Deposit $${fmt(amount)}`,
      });
      setFundOk(
        `Funded $${fmt(amount)} to ${fundSel.email}. Analysing for ${fmtDuration(anaMs)}.`,
      );
      setFundAmt("");
      setFundSel(null);
      setTimeout(() => setFundOk(""), 6000);
    } catch (e) {
      console.error(e);
      setFundErr("Failed to fund. Try again.");
    } finally {
      setFundLoading(false);
    }
  };
  const generateIncrementSchedule = (targetAmount, totalHours) => {
    if (!targetAmount || targetAmount <= 0 || !totalHours || totalHours <= 0)
      return [];
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
      if (increments[i].offsetMs < minNext) increments[i].offsetMs = minNext;
    }
    for (let i = increments.length - 1; i >= 0; i--) {
      const cap = endBuffer - (increments.length - 1 - i) * 60000;
      if (increments[i].offsetMs > cap) increments[i].offsetMs = cap;
    }
    return increments;
  };

  const handleTarget = async () => {
    const target = Math.round(parseFloat(tgtAmt.trim()) * 100) / 100;
    const hours = Math.max(0, parseInt(botHrs) || 0);
    const mins = Math.max(0, parseInt(botMins) || 0);
    const totalMs = hours * 3600000 + mins * 60000;

    if (!tgtSel) {
      setTgtErr("Select a user.");
      return;
    }
    if (!tgtSel.hasBeenFunded) {
      setTgtErr("Fund this user first.");
      return;
    }
    if (isNaN(target) || target <= 0) {
      setTgtErr("Enter a valid target amount.");
      return;
    }
    if (totalMs <= 0) {
      setTgtErr("Set a duration of at least 1 minute.");
      return;
    }

    const now = Timestamp.now();
    const anaExpMs = tgtSel.analysingExpiresAt?.toMillis?.() || 0;
    const botExpMs =
      tgtSel.botExpiresAt?.toMillis?.() || tgtSel.botExpiresAt || 0;

    // Bot is in analysing/scheduled phase (never activated yet, or pending)
    const isAnalysing =
      !botExpMs &&
      (tgtSel.botStatus === "analysing" ||
        tgtSel.botStatus === "scheduled" ||
        (anaExpMs && Date.now() < anaExpMs));

    setTgtLoading(true);
    setTgtErr("");
    setTgtOk("");

    try {
      const userRef = doc(db, "users", tgtSel.uid);
      const currentBalance = tgtSel.balance || 0;

      if (isAnalysing) {
        // Schedule — will auto-activate after analysing finishes
        await updateDoc(userRef, {
          targetAmount: target,
          botHours: hours + mins / 60,
          pendingTarget: true,
          pendingTargetSetAt: now,
          botStatus:
            tgtSel.botStatus === "scheduled" ? "scheduled" : "analysing",
          incrementSchedule: [],
          incrementScheduleStartMs: 0,
          incrementsApplied: 0,
        });
        await setDoc(doc(collection(db, "adminTransactions")), {
          userId: tgtSel.uid,
          userEmail: tgtSel.email,
          userName:
            `${tgtSel.firstName} ${tgtSel.lastName}`.trim() || tgtSel.username,
          initialAmount: currentBalance,
          targetAmount: target,
          botHours: hours + mins / 60,
          type: "bot_trading",
          timestamp: now,
          status: "scheduled",
          adminEmail: adminUser.email,
          note: "Will auto-activate after analysing completes + grace period",
        });
        setTgtOk(
          `Scheduled! $${fmt(currentBalance)} → $${fmt(currentBalance + target)} over ${hours}h ${mins}m.`,
        );
      } else {
        // Direct activation — works for first activation AND re-activation after expiry
        const botExpiresAt = Timestamp.fromMillis(now.toMillis() + totalMs);
        await updateDoc(userRef, {
          targetAmount: target,
          initialBalance: currentBalance,
          botActive: true,
          botStatus: "activated",
          botActivatedAt: now,
          botExpiresAt,
          botHours: hours + mins / 60,
          pendingTarget: false,
          scheduleActivateAt: null,
          lastTargetSetAt: now,
          incrementSchedule: generateIncrementSchedule(
            target,
            hours + mins / 60,
          ),
          incrementScheduleStartMs: now.toMillis(),
          incrementsApplied: 0,
        });
        await setDoc(doc(collection(db, "adminTransactions")), {
          userId: tgtSel.uid,
          userEmail: tgtSel.email,
          userName:
            `${tgtSel.firstName} ${tgtSel.lastName}`.trim() || tgtSel.username,
          initialAmount: currentBalance,
          targetAmount: target,
          botHours: hours + mins / 60,
          type: "bot_trading",
          timestamp: now,
          status: "trading",
          botExpiresAt,
          adminEmail: adminUser.email,
        });
        setTgtOk(
          `Bot activated! $${fmt(currentBalance)} → $${fmt(currentBalance + target)} over ${hours}h ${mins}m.`,
        );
      }

      setTgtAmt("");
      setBotHrs("1");
      setBotMins("0");
      setTgtSel(null);
      setTimeout(() => setTgtOk(""), 7000);
    } catch (e) {
      console.error(e);
      setTgtErr("Failed. Try again.");
    } finally {
      setTgtLoading(false);
    }
  };

  const handleWalletFailed = async () => {
    if (!wfSel) {
      setWfErr("Select a user.");
      return;
    }
    setWfLoading(true);
    setWfErr("");
    setWfOk("");
    try {
      const now = Timestamp.now();
      await updateDoc(doc(db, "users", wfSel.uid), {
        walletConnectionFailed: true,
        walletFailedAt: now,
      });
      await setDoc(doc(collection(db, "adminTransactions")), {
        userId: wfSel.uid,
        userEmail: wfSel.email,
        userName:
          `${wfSel.firstName} ${wfSel.lastName}`.trim() || wfSel.username,
        type: "wallet_failed",
        timestamp: now,
        status: "wallet_failed",
        adminEmail: adminUser.email,
        note: wfNote.trim() || "Wallet connection failed",
        balance: wfSel.balance,
      });
      await setDoc(doc(collection(db, "users", wfSel.uid, "transactions")), {
        type: "wallet_failed",
        amount: 0,
        status: "failed",
        timestamp: now,
        description: wfNote.trim() || "Wallet connection failed",
      });
      setWfOk(`Wallet connection failure logged for ${wfSel.email}.`);
      setWfSel(null);
      setWfNote("");
      setTimeout(() => setWfOk(""), 6000);
    } catch (e) {
      console.error(e);
      setWfErr("Failed to log. Try again.");
    } finally {
      setWfLoading(false);
    }
  };

  const handleMarkProcessingSuccess = async () => {
    if (!procSel) {
      setProcErr("Select a transaction.");
      return;
    }
    setProcLoading(true);
    setProcErr("");
    setProcOk("");
    try {
      const now = Timestamp.now();
      const txnRef = doc(
        db,
        "users",
        procSel.uid,
        "transactions",
        procSel.txnId,
      );
      await updateDoc(txnRef, { status: "successful" });
      const userRef = doc(db, "users", procSel.uid);
      const snap = await getDoc(userRef);
      const currentBalance = snap.data()?.balance || 0;
      const newBalance = Math.max(0, currentBalance - (procSel.amount || 0));
      await updateDoc(userRef, {
        balance: newBalance,
        withdrawalStatus: "successful",
        withdrawalCompletedCount:
          (snap.data()?.withdrawalCompletedCount || 0) + 1,
        lastWithdrawnAmount: procSel.amount || 0,
        withdrawalCompletedAt: now,
      });
      await setDoc(doc(collection(db, "adminTransactions")), {
        userId: procSel.uid,
        userEmail: procSel.userEmail,
        userName: procSel.userName,
        type: "withdrawal_success",
        amount: procSel.amount || 0,
        timestamp: now,
        status: "successful",
        adminEmail: adminUser.email,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        note: "Admin marked processing withdrawal as successful",
      });
      setProcOk(
        `Marked successful — $${fmt(procSel.amount)} for ${procSel.userEmail}. Balance: $${fmt(newBalance)}.`,
      );
      setProcSel(null);
      setTimeout(() => setProcOk(""), 7000);
    } catch (e) {
      console.error(e);
      setProcErr("Failed. Try again.");
    } finally {
      setProcLoading(false);
    }
  };

  const handleScheduleReversal = async () => {
    if (!revSel) {
      setRevErr("Select a user.");
      return;
    }
    const totalMs =
      (parseInt(revHrs) || 0) * 3600000 + (parseInt(revMins) || 0) * 60000;
    if (totalMs <= 0) {
      setRevErr("Set a reversal delay (at least 1 minute).");
      return;
    }
    const amount = revSel.lastWithdrawnAmount || 0;
    if (amount <= 0) {
      setRevErr("This user has no recorded withdrawal to reverse.");
      return;
    }
    setRevLoading(true);
    setRevErr("");
    setRevOk("");
    try {
      const firesAt = Date.now() + totalMs;
      const revRef = doc(collection(db, "scheduledReversals"));
      await setDoc(revRef, {
        userId: revSel.uid,
        userEmail: revSel.email,
        userName:
          `${revSel.firstName} ${revSel.lastName}`.trim() || revSel.username,
        amount,
        firesAt: Timestamp.fromMillis(firesAt),
        createdAt: Timestamp.now(),
        adminEmail: adminUser.email,
        status: "pending",
      });
      setRevOk(
        `Reversal of $${fmt(amount)} scheduled for ${revSel.email} in ${fmtDuration(totalMs)}.`,
      );
      setRevSel(null);
      setRevHrs("0");
      setRevMins("30");
      setTimeout(() => setRevOk(""), 8000);
    } catch (e) {
      console.error("Schedule reversal error:", e);
      setRevErr("Failed to schedule reversal. Check console for details.");
    } finally {
      setRevLoading(false);
    }
  };

  const handleVsnDeposit = async () => {
    if (!vsnSel) {
      setVsnDepositErr("Select a user first.");
      return;
    }
    const amount = parseFloat(vsnDepositAmt);
    if (isNaN(amount) || amount <= 0) {
      setVsnDepositErr("Enter a valid deposit amount.");
      return;
    }
    setVsnDepositLoading(true);
    setVsnDepositErr("");
    setVsnDepositOk("");
    try {
      const now = Timestamp.now();
      const userRef = doc(db, "users", vsnSel.uid);
      const snap = await getDoc(userRef);
      const currentBalance = snap.data()?.balance || 0;
      const newBalance = currentBalance + amount;
      await updateDoc(userRef, { balance: newBalance });
      await setDoc(doc(collection(db, "users", vsnSel.uid, "transactions")), {
        type: "vsn",
        amount,
        status: "successful",
        timestamp: now,
        description: `VSN Deposit — $${fmt(amount)} added to your account`,
      });
      await setDoc(doc(collection(db, "adminTransactions")), {
        userId: vsnSel.uid,
        userEmail: vsnSel.email,
        userName:
          `${vsnSel.firstName} ${vsnSel.lastName}`.trim() || vsnSel.username,
        type: "vsn_deposit",
        amount,
        timestamp: now,
        status: "successful",
        adminEmail: adminUser.email,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
      });
      setVsnDepositOk(
        `$${fmt(amount)} deposited to ${vsnSel.email}. New balance: $${fmt(newBalance)}.`,
      );
      setVsnDepositAmt("");
      setTimeout(() => setVsnDepositOk(""), 7000);
    } catch (e) {
      console.error(e);
      setVsnDepositErr("Deposit failed. Try again.");
    } finally {
      setVsnDepositLoading(false);
    }
  };

  const handleSendVSN = async () => {
    if (!vsnSel) {
      setVsnErr("Select a user.");
      return;
    }
    if (!vsnCode.trim() || vsnCode.trim().length < 4) {
      setVsnErr("Enter a valid VSN code (min 4 chars).");
      return;
    }
    setVsnLoading(true);
    setVsnErr("");
    setVsnOk("");
    try {
      const now = Timestamp.now();
      await updateDoc(doc(db, "users", vsnSel.uid), {
        vsn_required: true,
        vsn_code: vsnCode.trim(),
        vsn_issued_at: now,
        vsn_verified: false,
      });
      await setDoc(doc(collection(db, "adminTransactions")), {
        userId: vsnSel.uid,
        userEmail: vsnSel.email,
        userName:
          `${vsnSel.firstName} ${vsnSel.lastName}`.trim() || vsnSel.username,
        type: "vsn_request",
        vsn_code: vsnCode.trim(),
        timestamp: now,
        status: "pending",
        adminEmail: adminUser.email,
      });
      try {
        await emailjs.send(
          "service_iaukz5q",
          "template_hqjxv6g",
          {
            email: vsnSel.email,
            passcode: vsnCode.trim(),
            time: new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          "Zjh3-YGuzQVKNSkoO",
        );
      } catch (emailErr) {
        console.error("EmailJS error:", emailErr);
      }
      setVsnOk(`VSN "${vsnCode.trim()}" sent to ${vsnSel.email} via email.`);
      setVsnCode("");
      setVsnSel(null);
      setTimeout(() => setVsnOk(""), 8000);
    } catch (e) {
      console.error(e);
      setVsnErr("Failed. Try again.");
    } finally {
      setVsnLoading(false);
    }
  };

  const getBotStatus = (u) => {
    if (!u.hasBeenFunded)
      return { text: "Not Funded", color: "#6b7280", dot: "#6b7280" };
    const now = nowMs;
    const exp = u.botExpiresAt?.toMillis?.() || u.botExpiresAt;
    const ana = u.analysingExpiresAt?.toMillis?.() || u.analysingExpiresAt;
    const sch = u.scheduleActivateAt?.toMillis?.() || u.scheduleActivateAt;
    if (exp && now > exp)
      return { text: "Bot Trading Disabled", color: "#ef4444", dot: "#ef4444" };
    if (exp && now <= exp)
      return {
        text: "Bot Trading Activated",
        color: "#22c55e",
        dot: "#22c55e",
      };
    if (u.botStatus === "scheduled" || (sch && now <= sch))
      return {
        text: "Scheduling — Activating",
        color: "#f59e0b",
        dot: "#f59e0b",
      };
    if (u.pendingTarget || (ana && now <= ana) || u.hasBeenFunded)
      return {
        text: "OmniDev Analysing Market",
        color: "#3b82f6",
        dot: "#3b82f6",
      };
    return { text: "Bot Trading Disabled", color: "#ef4444", dot: "#ef4444" };
  };

  const getTxnStatus = useCallback(
    (t) => {
      const now = nowMs;
      const live = users.find((u) => u.uid === t.userId);
      const liveSt = live?.botStatus || "disabled";
      if (t.type === "vsn_request") {
        if (live?.withdrawalStatus === "successful") return "successful";
        if (
          live?.vsn_verified ||
          (!live?.vsn_required && !live?.vsn_verified && t.status !== "pending")
        ) {
          const failsAtMs =
            t.failsAt?.toMillis?.() ||
            t.failsAt ||
            (t.timestamp instanceof Date
              ? t.timestamp.getTime() + 10 * 60 * 1000
              : null);
          if (failsAtMs && Date.now() >= failsAtMs) return "failed";
          return "processing";
        }
        if (live?.vsn_required) return "Sent";
        return t.status || "pending";
      }
      if (t.type === "initial_fund") {
        if (liveSt === "disabled" || liveSt === "activated") return "completed";
        const anaExp =
          t.analysingExpiresAt?.toMillis?.() || t.analysingExpiresAt;
        if (anaExp && now < anaExp) return "analysing";
        return "completed";
      }
      if (t.type === "bot_trading") {
        if (t.status === "disabled") return "disabled";
        const exp = t.botExpiresAt?.toMillis?.() || t.botExpiresAt;
        if (exp && now >= exp) return "disabled";
        if (exp && now < exp) return "trading";
        if (liveSt === "activated") return "trading";
        if (liveSt === "scheduled") return "scheduled";
        if (liveSt === "disabled") return "disabled";
        return t.status || "scheduled";
      }
      if (liveSt === "disabled") return "completed";
      return t.status || "completed";
    },
    [nowMs, users],
  );

  const fmtLeft = (ts) => {
    if (!ts) return "";
    const ms = (ts.toMillis?.() || ts) - nowMs;
    if (ms <= 0) return "Expired";
    const m = Math.floor(ms / 60000),
      h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
  };

  const fmtCountdown = (firesAt) => {
    const ms = firesAt - Date.now();
    if (ms <= 0) return "Firing now...";
    const m = Math.floor(ms / 60000),
      h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
  };

  const getAvailableYears = () =>
    Array.from(new Set(txns.map((t) => t.timestamp.getFullYear()))).sort(
      (a, b) => b - a,
    );

  const filteredTxns = getFilteredTxns();
  const visibleTxns = filteredTxns.slice(0, txnPage * TXN_PAGE_SIZE);
  const hasMore = visibleTxns.length < filteredTxns.length;

  const clearFund = () => {
    setFundSel(null);
    setFundAmt("");
    setFundErr("");
    setFundOk("");
  };
  const clearTgt = () => {
    setTgtSel(null);
    setTgtAmt("");
    setTgtErr("");
    setTgtOk("");
    setBotHrs("1");
    setBotMins("0");
  };
  const clearVsn = () => {
    setVsnSel(null);
    setVsnCode("");
    setVsnErr("");
    setVsnOk("");
    setVsnDepositAmt("");
    setVsnDepositErr("");
    setVsnDepositOk("");
  };
  const clearWf = () => {
    setWfSel(null);
    setWfNote("");
    setWfErr("");
    setWfOk("");
  };
  const clearProc = () => {
    setProcSel(null);
    setProcErr("");
    setProcOk("");
  };
  const clearRev = () => {
    setRevSel(null);
    setRevHrs("0");
    setRevMins("30");
    setRevErr("");
    setRevOk("");
  };

  const txnRows = useMemo(() => {
    return visibleTxns.map((t) => {
      const ls = getTxnStatus(t);
      const colors =
        t.type === "wallet_failed"
          ? {
              bg: "rgba(239,68,68,0.15)",
              text: "#ef4444",
              label: "Wallet Failed",
            }
          : t.type === "vsn_request"
            ? {
                bg: "rgba(124,92,252,0.15)",
                text: "#a78bfa",
                label: "VSN Request",
              }
            : t.type === "vsn_deposit"
              ? {
                  bg: "rgba(34,197,94,0.15)",
                  text: "#22c55e",
                  label: "VSN Deposit",
                }
              : t.type === "withdrawal_success"
                ? {
                    bg: "rgba(13,148,136,0.15)",
                    text: "#0d9488",
                    label: "Withdrawal",
                  }
                : t.type === "reversal"
                  ? {
                      bg: "rgba(34,197,94,0.15)",
                      text: "#22c55e",
                      label: "Reversal",
                    }
                  : STATUS_COLORS[ls] || STATUS_COLORS.completed;

      let typeLabel = t.type;
      if (t.type === "wallet_failed") typeLabel = "Wallet Failed";
      else if (t.type === "withdrawal_success") typeLabel = "Withdrawal";
      else if (t.type === "vsn_deposit") typeLabel = "VSN Deposit";
      else if (t.type === "reversal") typeLabel = "Reversal";
      else if (t.type === "vsn_request")
        typeLabel =
          ls === "completed"
            ? "VSN Verified"
            : ls === "analysing"
              ? "VSN Sent"
              : "VSN Request";
      else if (t.type === "initial_fund")
        typeLabel =
          ls === "analysing"
            ? `Analysing (${fmtDuration(t.analysingDurationMs)})`
            : "Deposit";
      else if (t.type === "bot_trading") typeLabel = colors.label;

      return (
        <tr key={t.id}>
          <td data-label="User">
            <p
              style={{
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                margin: 0,
              }}
            >
              {t.userName || t.userEmail}
            </p>
            <p style={{ color: "#6b7280", fontSize: "10px", margin: 0 }}>
              {t.userEmail}
            </p>
          </td>
          <td data-label="Type">
            <span
              className="txn-badge"
              style={{ background: colors.bg, color: colors.text }}
            >
              {typeLabel}
            </span>
          </td>
          <td data-label="Amount" className="amount">
            {t.type === "vsn_request" || t.type === "wallet_failed" ? (
              <span style={{ color: "#6b7280" }}>—</span>
            ) : t.type === "withdrawal_success" ? (
              <span style={{ color: "#ef4444" }}>-${fmt(t.amount || 0)}</span>
            ) : (
              `+$${fmt(t.amount || t.initialAmount || 0)}`
            )}
          </td>
          <td data-label="Detail" className="amount">
            {t.type === "wallet_failed" ? (
              <span
                style={{
                  color: "#9ca3af",
                  fontSize: "11px",
                  fontStyle: "italic",
                }}
              >
                {t.note || "Wallet connection failed"}
              </span>
            ) : t.type === "withdrawal_success" ? (
              <span style={{ color: "#9ca3af", fontSize: "11px" }}>
                {t.wallet ? t.wallet.slice(0, 16) + "…" : "—"}
              </span>
            ) : t.targetAmount ? (
              `$${fmt(t.targetAmount)}`
            ) : t.vsn_code ? (
              <span
                style={{
                  color: "#a78bfa",
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                }}
              >
                {t.vsn_code}
              </span>
            ) : (
              "—"
            )}
          </td>
          <td data-label="Hrs" className="amount">
            {t.botHours ? `${t.botHours}h` : "—"}
          </td>
          <td data-label="Status">
            {(() => {
              const statusColors = STATUS_COLORS[ls] || STATUS_COLORS.completed;
              return (
                <span
                  className="txn-badge"
                  style={{
                    background: statusColors.bg,
                    color: statusColors.text,
                  }}
                >
                  {ls === "wallet_failed" ? "failed" : ls}
                </span>
              );
            })()}
          </td>
          <td data-label="Date" className="date-cell">
            {t.timestamp.toLocaleString()}
          </td>
        </tr>
      );
    });
  }, [visibleTxns, getTxnStatus]);

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #1a1a1a",
            borderTop: "3px solid #0d9488",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ color: "#9ca3af" }}>Loading admin panel...</p>
      </div>
    );

  const pendingWithdrawals = users.filter(
    (u) => u.withdrawalStatus === "pending_support",
  );
  const vsnPending = users.filter((u) => u.vsn_required && !u.vsn_verified);
  const vsnVerified = users.filter((u) => u.vsn_verified);
  const walletFailedUsers = users.filter((u) => u.walletConnectionFailed);
  const withdrawalSuccessUsers = users.filter(
    (u) => u.lastWithdrawnAmount > 0 || u.withdrawalCompletedCount > 0,
  );
  const liveProcessingTxns = processingTxns.filter((t) => {
    const failsAtMs =
      t.failsAt?.toMillis?.() ||
      t.failsAt ||
      (t.timestamp instanceof Date
        ? t.timestamp.getTime() + 10 * 60 * 1000
        : null);
    return !failsAtMs || Date.now() < failsAtMs;
  });

  const UserCard = ({ user }) => {
    const s = getBotStatus(user);
    return (
      <div className="user-card">
        <div className="user-card-header">
          <div className="user-avatar">
            {user.picture ? (
              <img src={user.picture} alt="" />
            ) : (
              (user.firstName?.[0] || user.email[0]).toUpperCase()
            )}
          </div>
          <div className="user-info">
            <p className="user-name">
              {user.firstName} {user.lastName}
            </p>
            <p className="user-handle">@{user.username || "no username"}</p>
          </div>
        </div>
        <span className="status-badge" style={{ color: s.color }}>
          <span className="status-dot" style={{ background: s.dot }} />
          {s.text}
        </span>
      </div>
    );
  };

  const AdminHeader = ({ title, showBack = false }) => (
    <header className="admin-header">
      <div className="admin-header-left">
        <div className="admin-logo">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <h1 className="admin-title">{title}</h1>
          <p className="admin-email">{adminUser?.email}</p>
        </div>
      </div>
      <div className="admin-header-actions">
        {showBack ? (
          <button
            className="btn-back"
            onClick={() => {
              clearVsn();
              clearWf();
              clearProc();
              clearRev();
              setView("main");
            }}
          >
            ← Back to Dashboard
          </button>
        ) : (
          <>
            <button
              className="hdr-btn"
              onClick={() => setView("processing")}
              style={{
                background:
                  liveProcessingTxns.length > 0
                    ? "linear-gradient(135deg,#0d9488,#065f46)"
                    : "rgba(13,148,136,0.15)",
                color: "#fff",
                border: "none",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Withdrawals</span>
              {liveProcessingTxns.length > 0 && (
                <span className="hdr-badge" style={{ background: "#0d9488" }}>
                  {liveProcessingTxns.length}
                </span>
              )}
            </button>
            <button
              className="hdr-btn"
              onClick={() => setView("reversal")}
              style={{
                background: "rgba(245,158,11,0.15)",
                color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.25)",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.46" />
              </svg>
              <span>Reversal</span>
              {pendingReversals.length > 0 && (
                <span className="hdr-badge" style={{ background: "#f59e0b" }}>
                  {pendingReversals.length}
                </span>
              )}
            </button>
            <button
              className="hdr-btn hdr-btn-vsn"
              onClick={() => setView("vsn")}
              style={{
                background:
                  pendingWithdrawals.length > 0
                    ? "linear-gradient(135deg,#7C5CFC,#5b3fd4)"
                    : "rgba(124,92,252,0.15)",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Send VSN</span>
              {pendingWithdrawals.length > 0 && (
                <span className="hdr-badge">{pendingWithdrawals.length}</span>
              )}
            </button>
            <button
              className="hdr-btn hdr-btn-wf"
              onClick={() => setView("wallet_failed")}
              style={{
                background:
                  walletFailedUsers.length > 0
                    ? "rgba(239,68,68,0.22)"
                    : "rgba(239,68,68,0.1)",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Wallet Failed</span>
              {walletFailedUsers.length > 0 && (
                <span className="hdr-badge hdr-badge-red">
                  {walletFailedUsers.length}
                </span>
              )}
            </button>
            <button className="btn-back" onClick={() => navigate("/dashboard")}>
              Back to Site
            </button>
          </>
        )}
      </div>
    </header>
  );

  if (view === "processing") {
    return (
      <div className="admin-dashboard">
        <AdminHeader title="Processing Withdrawals" showBack />
        <div className="sub-page-wrap">
          <div className="card">
            <div
              className="info-banner"
              style={{
                background: "rgba(13,148,136,0.08)",
                border: "1px solid rgba(13,148,136,0.2)",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "18px",
              }}
            >
              <p className="info-banner-title" style={{ color: "#0d9488" }}>
                How this works
              </p>
              <p className="info-banner-body">
                These are withdrawal transactions currently in{" "}
                <strong style={{ color: "#fff" }}>processing</strong> status.
                They auto-fail after 10 minutes if you don't act. Select one and
                mark it as successful to update it in-place.
              </p>
            </div>
            <div className="stats-row">
              {[
                {
                  label: "Live Processing",
                  value: liveProcessingTxns.length,
                  color: "#0d9488",
                  bg: "rgba(13,148,136,0.1)",
                },
                {
                  label: "Total Users",
                  value: users.length,
                  color: "#9ca3af",
                  bg: "rgba(156,163,175,0.1)",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="stat-box"
                  style={{ background: s.bg }}
                >
                  <p className="stat-value" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  <p className="stat-label">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">
                Select Processing Transaction
              </label>
              <select
                className="form-select"
                value={procSel?.txnId || ""}
                onChange={(e) => {
                  setProcSel(
                    liveProcessingTxns.find(
                      (t) => t.txnId === e.target.value,
                    ) || null,
                  );
                  setProcErr("");
                }}
              >
                <option value="">Choose a processing withdrawal...</option>
                {liveProcessingTxns.map((t) => {
                  const failsAtMs =
                    t.failsAt?.toMillis?.() ||
                    t.failsAt ||
                    (t.timestamp instanceof Date
                      ? t.timestamp.getTime() + 10 * 60 * 1000
                      : null);
                  const minsLeft = failsAtMs
                    ? Math.max(0, Math.ceil((failsAtMs - Date.now()) / 60000))
                    : "?";
                  return (
                    <option key={t.txnId} value={t.txnId}>
                      {t.userEmail} — ${fmt(t.amount)} — {minsLeft}m left
                    </option>
                  );
                })}
              </select>
            </div>
            {procSel && (
              <div className="info-box">
                <p className="info-row">
                  User: <strong>{procSel.userEmail}</strong>
                </p>
                <p className="info-row">
                  Amount:{" "}
                  <strong style={{ color: "#0d9488" }}>
                    ${fmt(procSel.amount)}
                  </strong>
                </p>
                <p className="info-row">
                  Transaction ID:{" "}
                  <strong style={{ color: "#6b7280", fontSize: "11px" }}>
                    #{procSel.txnId.slice(-8).toUpperCase()}
                  </strong>
                </p>
                <p className="info-row">
                  Description:{" "}
                  <strong>{procSel.description || "Withdrawal request"}</strong>
                </p>
                {(() => {
                  const failsAtMs =
                    procSel.failsAt?.toMillis?.() ||
                    procSel.failsAt ||
                    (procSel.timestamp instanceof Date
                      ? procSel.timestamp.getTime() + 10 * 60 * 1000
                      : null);
                  if (failsAtMs) {
                    const minsLeft = Math.max(
                      0,
                      Math.ceil((failsAtMs - Date.now()) / 60000),
                    );
                    return (
                      <p className="info-row">
                        Auto-fails in:{" "}
                        <strong
                          style={{
                            color: minsLeft <= 2 ? "#ef4444" : "#f59e0b",
                          }}
                        >
                          {minsLeft}m
                        </strong>
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
            {procErr && <div className="alert alert-error">{procErr}</div>}
            {procOk && <div className="alert alert-success">{procOk}</div>}
            <div className="btn-group">
              <button
                className="btn-primary"
                onClick={handleMarkProcessingSuccess}
                disabled={procLoading || !procSel}
                style={{
                  background: procSel
                    ? "linear-gradient(135deg,#0d9488,#065f46)"
                    : undefined,
                  border: "none",
                }}
              >
                {procLoading ? (
                  <>
                    <span className="spinner" /> Marking...
                  </>
                ) : (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>{" "}
                    Mark as Successful
                  </>
                )}
              </button>
              <button className="btn-secondary" onClick={clearProc}>
                Clear
              </button>
            </div>
          </div>
          {liveProcessingTxns.length > 0 && (
            <div className="card">
              <h2 className="card-title" style={{ margin: "0 0 14px" }}>
                All Processing Withdrawals ({liveProcessingTxns.length})
              </h2>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      {["User", "Amount", "Time Left", "Description"].map(
                        (h) => (
                          <th key={h}>{h}</th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {liveProcessingTxns.map((t) => {
                      const failsAtMs =
                        t.failsAt?.toMillis?.() ||
                        t.failsAt ||
                        (t.timestamp instanceof Date
                          ? t.timestamp.getTime() + 10 * 60 * 1000
                          : null);
                      const minsLeft = failsAtMs
                        ? Math.max(
                            0,
                            Math.ceil((failsAtMs - Date.now()) / 60000),
                          )
                        : null;
                      return (
                        <tr
                          key={t.txnId}
                          onClick={() => {
                            setProcSel(t);
                            setProcErr("");
                          }}
                        >
                          <td data-label="User">
                            <p
                              style={{
                                color: "#fff",
                                fontSize: "12px",
                                fontWeight: 600,
                                margin: 0,
                              }}
                            >
                              {t.userEmail}
                            </p>
                            <p
                              style={{
                                color: "#6b7280",
                                fontSize: "10px",
                                margin: 0,
                              }}
                            >
                              #{t.txnId.slice(-8).toUpperCase()}
                            </p>
                          </td>
                          <td
                            data-label="Amount"
                            className="amount"
                            style={{ color: "#0d9488" }}
                          >
                            ${fmt(t.amount)}
                          </td>
                          <td data-label="Time Left">
                            {minsLeft !== null ? (
                              <span
                                style={{
                                  color: minsLeft <= 2 ? "#ef4444" : "#f59e0b",
                                  fontWeight: 700,
                                  fontSize: "12px",
                                }}
                              >
                                {minsLeft}m
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td
                            data-label="Description"
                            style={{ color: "#9ca3af", fontSize: "11px" }}
                          >
                            {t.description || "Withdrawal request"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "reversal") {
    return (
      <div className="admin-dashboard">
        <AdminHeader title="Schedule Reversal" showBack />
        <div className="sub-page-wrap">
          <div className="card">
            <div
              className="info-banner"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "18px",
              }}
            >
              <p className="info-banner-title" style={{ color: "#f59e0b" }}>
                How this works
              </p>
              <p className="info-banner-body">
                Select a user who has had a successful withdrawal. Set a delay
                timer — when it fires, the withdrawn amount is added back to
                their balance and a{" "}
                <strong style={{ color: "#fff" }}>Reversal</strong> transaction
                appears in their history.
              </p>
            </div>
            <div className="stats-row">
              {[
                {
                  label: "Eligible Users",
                  value: withdrawalSuccessUsers.length,
                  color: "#f59e0b",
                  bg: "rgba(245,158,11,0.1)",
                },
                {
                  label: "Pending Reversals",
                  value: pendingReversals.length,
                  color: "#a78bfa",
                  bg: "rgba(124,92,252,0.1)",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="stat-box"
                  style={{ background: s.bg }}
                >
                  <p className="stat-value" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  <p className="stat-label">{s.label}</p>
                </div>
              ))}
            </div>
            {pendingReversals.length > 0 && (
              <div
                style={{
                  background: "rgba(124,92,252,0.08)",
                  border: "1px solid rgba(124,92,252,0.2)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    color: "#a78bfa",
                    fontSize: "12px",
                    fontWeight: 700,
                    margin: "0 0 8px",
                  }}
                >
                  Active Reversal Timers
                </p>
                {pendingReversals.map((r) => (
                  <div
                    key={r.revDocId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span style={{ color: "#d1d5db", fontSize: "12px" }}>
                      {r.userEmail}
                    </span>
                    <span
                      style={{
                        color: "#22c55e",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      +${fmt(r.amount)}
                    </span>
                    <span style={{ color: "#f59e0b", fontSize: "11px" }}>
                      {fmtCountdown(r.firesAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Select User</label>
              <select
                className="form-select"
                value={revSel?.uid || ""}
                onChange={(e) => {
                  setRevSel(
                    users.find((u) => u.uid === e.target.value) || null,
                  );
                  setRevErr("");
                }}
              >
                <option value="">
                  Choose a user with a completed withdrawal...
                </option>
                {withdrawalSuccessUsers.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.email} — Balance: ${fmt(u.balance)} — Last withdrawn: $
                    {fmt(u.lastWithdrawnAmount)}
                  </option>
                ))}
              </select>
            </div>
            {revSel && (
              <div className="info-box">
                <p className="info-row">
                  Email: <strong>{revSel.email}</strong>
                </p>
                <p className="info-row">
                  Current Balance: <strong>${fmt(revSel.balance)}</strong>
                </p>
                <p className="info-row">
                  Amount to reverse:{" "}
                  <strong style={{ color: "#22c55e" }}>
                    +${fmt(revSel.lastWithdrawnAmount)}
                  </strong>
                </p>
                <p className="info-row">
                  Balance after reversal:{" "}
                  <strong style={{ color: "#0d9488" }}>
                    ${fmt(revSel.balance + (revSel.lastWithdrawnAmount || 0))}
                  </strong>
                </p>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Reversal Delay</label>
              <div className="input-row">
                <select
                  className="form-select"
                  value={revHrs}
                  onChange={(e) => setRevHrs(e.target.value)}
                >
                  {Array.from({ length: 49 }, (_, i) => (
                    <option key={i} value={i}>
                      {i} hr{i !== 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                <select
                  className="form-select"
                  value={revMins}
                  onChange={(e) => setRevMins(e.target.value)}
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>
                      {m} min{m !== 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <p className="form-hint">
                Reversal fires automatically after this delay. Works even if you
                close the page.
              </p>
            </div>
            {revErr && <div className="alert alert-error">{revErr}</div>}
            {revOk && <div className="alert alert-success">{revOk}</div>}
            <div className="btn-group">
              <button
                className="btn-primary"
                onClick={handleScheduleReversal}
                disabled={revLoading || !revSel}
                style={{
                  background: revSel
                    ? "linear-gradient(135deg,#f59e0b,#b45309)"
                    : undefined,
                  border: "none",
                }}
              >
                {revLoading ? (
                  <>
                    <span className="spinner" /> Scheduling...
                  </>
                ) : (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 .49-3.46" />
                    </svg>{" "}
                    Schedule Reversal
                  </>
                )}
              </button>
              <button className="btn-secondary" onClick={clearRev}>
                Clear
              </button>
            </div>
          </div>
          {withdrawalSuccessUsers.length > 0 && (
            <div className="card">
              <h2 className="card-title" style={{ margin: "0 0 14px" }}>
                Users Eligible for Reversal ({withdrawalSuccessUsers.length})
              </h2>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      {["User", "Balance", "Last Withdrawn", "Withdrawals"].map(
                        (h) => (
                          <th key={h}>{h}</th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalSuccessUsers.map((u) => (
                      <tr
                        key={u.uid}
                        onClick={() => {
                          setRevSel(u);
                          setRevErr("");
                        }}
                      >
                        <td data-label="User">
                          <p
                            style={{
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: 600,
                              margin: 0,
                            }}
                          >
                            {u.email}
                          </p>
                          <p
                            style={{
                              color: "#6b7280",
                              fontSize: "10px",
                              margin: 0,
                            }}
                          >
                            @{u.username || "—"}
                          </p>
                        </td>
                        <td data-label="Balance" className="amount">
                          ${fmt(u.balance)}
                        </td>
                        <td
                          data-label="Last Withdrawn"
                          className="amount"
                          style={{ color: "#f59e0b" }}
                        >
                          ${fmt(u.lastWithdrawnAmount)}
                        </td>
                        <td data-label="Withdrawals">
                          {u.withdrawalCompletedCount || 1}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "wallet_failed") {
    return (
      <div className="admin-dashboard">
        <AdminHeader title="Mark Wallet Failed" showBack />
        <div className="sub-page-wrap">
          <div className="card">
            <div className="info-banner info-banner-red">
              <p className="info-banner-title">How this works</p>
              <p className="info-banner-body">
                Log a wallet connection failure for a user. It will appear in
                both the admin transaction history and the{" "}
                <strong style={{ color: "#fff" }}>
                  user's own transaction history
                </strong>
                .
              </p>
            </div>
            <div className="stats-row">
              {[
                {
                  label: "Total Users",
                  value: users.length,
                  color: "#9ca3af",
                  bg: "rgba(156,163,175,0.1)",
                },
                {
                  label: "Wallet Failed",
                  value: walletFailedUsers.length,
                  color: "#ef4444",
                  bg: "rgba(239,68,68,0.1)",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="stat-box"
                  style={{ background: s.bg }}
                >
                  <p className="stat-value" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  <p className="stat-label">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Select User</label>
              <select
                className="form-select"
                value={wfSel?.uid || ""}
                onChange={(e) => {
                  setWfSel(users.find((u) => u.uid === e.target.value) || null);
                  setWfErr("");
                }}
              >
                <option value="">Choose a user...</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.email} — ${fmt(u.balance)}
                    {u.walletConnectionFailed ? " Prev. Failed" : ""}
                  </option>
                ))}
              </select>
            </div>
            {wfSel && (
              <div className="info-box">
                <p className="info-row">
                  Email: <strong>{wfSel.email}</strong>
                </p>
                <p className="info-row">
                  Balance: <strong>${fmt(wfSel.balance)}</strong>
                </p>
                <p className="info-row">
                  Bot Status:{" "}
                  <strong style={{ color: getBotStatus(wfSel).color }}>
                    {getBotStatus(wfSel).text}
                  </strong>
                </p>
                {wfSel.walletConnectionFailed && (
                  <p className="info-row">
                    <span
                      style={{
                        color: "#ef4444",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      Previously flagged as wallet failed
                    </span>
                  </p>
                )}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">
                Note{" "}
                <span
                  style={{
                    color: "#6b7280",
                    fontWeight: 400,
                    textTransform: "none",
                  }}
                >
                  (optional)
                </span>
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. User reported MetaMask error"
                value={wfNote}
                onChange={(e) => {
                  setWfNote(e.target.value);
                  setWfErr("");
                }}
              />
              <p className="form-hint">
                Shows in both admin and user transaction history.
              </p>
            </div>
            {wfErr && <div className="alert alert-error">{wfErr}</div>}
            {wfOk && <div className="alert alert-success">{wfOk}</div>}
            <div className="btn-group">
              <button
                className="btn-primary"
                onClick={handleWalletFailed}
                disabled={wfLoading || !wfSel}
                style={{
                  background: wfSel
                    ? "linear-gradient(135deg,#dc2626,#991b1b)"
                    : undefined,
                  border: "none",
                }}
              >
                {wfLoading ? (
                  <>
                    <span className="spinner" /> Logging...
                  </>
                ) : (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>{" "}
                    Mark Wallet Failed
                  </>
                )}
              </button>
              <button className="btn-secondary" onClick={clearWf}>
                Clear
              </button>
            </div>
          </div>
          {walletFailedUsers.length > 0 && (
            <div className="card">
              <h2 className="card-title" style={{ margin: "0 0 14px" }}>
                Users with Wallet Failures ({walletFailedUsers.length})
              </h2>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      {["User", "Balance", "Status"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {walletFailedUsers.map((u) => (
                      <tr
                        key={u.uid}
                        onClick={() => {
                          setWfSel(u);
                          setWfErr("");
                        }}
                      >
                        <td data-label="User">
                          <div className="table-user">
                            <div className="table-avatar">
                              {u.picture ? (
                                <img src={u.picture} alt="" />
                              ) : (
                                (u.firstName?.[0] || u.email[0]).toUpperCase()
                              )}
                            </div>
                            <div className="table-user-info">
                              <p className="table-user-email">{u.email}</p>
                              <p className="table-user-handle">
                                @{u.username || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td data-label="Balance" className="amount">
                          ${fmt(u.balance)}
                        </td>
                        <td data-label="Status">
                          <span className="pill pill-red">Failed</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "vsn") {
    return (
      <div className="admin-dashboard">
        <AdminHeader title="Send VSN Code" showBack />
        {pendingWithdrawals.length > 0 && (
          <div
            className="alert-banner"
            style={{
              background: "rgba(124,92,252,0.12)",
              borderColor: "rgba(124,92,252,0.3)",
              color: "#a78bfa",
            }}
          >
            {pendingWithdrawals.length} user(s) waiting for withdrawal support —
            issue a VSN code below.
          </div>
        )}
        <div className="sub-page-wrap">
          <div className="card">
            <div className="card-header">
              <span className="card-badge" style={{ background: "#22c55e" }}>
                $
              </span>
              <h2 className="card-title">Deposit to User (VSN)</h2>
            </div>
            <p
              style={{
                color: "#6b7280",
                fontSize: "13px",
                margin: "0 0 16px",
                lineHeight: 1.6,
              }}
            >
              Add funds to the selected user's balance. This reflects
              immediately in their dashboard and creates a VSN Deposit
              transaction in their history.
            </p>
            <div className="form-group">
              <label className="form-label">Select User</label>
              <select
                className="form-select"
                value={vsnSel?.uid || ""}
                onChange={(e) => {
                  setVsnSel(
                    users.find((u) => u.uid === e.target.value) || null,
                  );
                  setVsnErr("");
                  setVsnDepositErr("");
                }}
              >
                <option value="">Choose a user...</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.email} — ${fmt(u.balance)}
                    {u.withdrawalStatus === "pending_support"
                      ? " Withdrawal Pending"
                      : ""}
                    {u.vsn_required && !u.vsn_verified ? " • VSN Sent" : ""}
                    {u.vsn_verified ? " • Verified" : ""}
                  </option>
                ))}
              </select>
            </div>
            {vsnSel && (
              <div className="info-box">
                <p className="info-row">
                  Email: <strong>{vsnSel.email}</strong>
                </p>
                <p className="info-row">
                  Current Balance:{" "}
                  <strong style={{ color: "#0d9488" }}>
                    ${fmt(vsnSel.balance)}
                  </strong>
                </p>
                {vsnSel.pendingWithdrawAmount > 0 && (
                  <p className="info-row">
                    Pending Withdrawal:{" "}
                    <strong style={{ color: "#a78bfa" }}>
                      ${fmt(vsnSel.pendingWithdrawAmount)}
                    </strong>
                  </p>
                )}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Deposit Amount (USD)</label>
              <input
                className="form-input"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 500"
                value={vsnDepositAmt}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    setVsnDepositAmt(val);
                    setVsnDepositErr("");
                  }
                }}
              />
              {vsnSel && vsnDepositAmt && parseFloat(vsnDepositAmt) > 0 && (
                <p className="form-hint" style={{ color: "#22c55e" }}>
                  Balance after deposit: $
                  {fmt((vsnSel.balance || 0) + parseFloat(vsnDepositAmt))}
                </p>
              )}
            </div>
            {vsnDepositErr && (
              <div className="alert alert-error">{vsnDepositErr}</div>
            )}
            {vsnDepositOk && (
              <div className="alert alert-success">{vsnDepositOk}</div>
            )}
            <div className="btn-group">
              <button
                className="btn-primary"
                onClick={handleVsnDeposit}
                disabled={vsnDepositLoading || !vsnSel}
                style={{
                  background: vsnSel
                    ? "linear-gradient(135deg,#22c55e,#15803d)"
                    : undefined,
                  border: "none",
                }}
              >
                {vsnDepositLoading ? (
                  <>
                    <span className="spinner" /> Depositing...
                  </>
                ) : (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>{" "}
                    Make VSN Deposit
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-badge" style={{ background: "#7C5CFC" }}>
                🔐
              </span>
              <h2 className="card-title">Generate VSN Code</h2>
            </div>
            <div className="info-banner info-banner-purple">
              <p className="info-banner-title" style={{ color: "#a78bfa" }}>
                How this works
              </p>
              <p className="info-banner-body">
                Generate a VSN code for a user who has contacted support.
              </p>
            </div>
            <div className="stats-row stats-row-3">
              {[
                {
                  label: "Awaiting Support",
                  value: pendingWithdrawals.length,
                  color: "#a78bfa",
                  bg: "rgba(124,92,252,0.1)",
                },
                {
                  label: "VSN Sent",
                  value: vsnPending.length,
                  color: "#f59e0b",
                  bg: "rgba(245,158,11,0.1)",
                },
                {
                  label: "VSN Verified",
                  value: vsnVerified.length,
                  color: "#22c55e",
                  bg: "rgba(34,197,94,0.1)",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="stat-box"
                  style={{ background: s.bg }}
                >
                  <p className="stat-value" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  <p className="stat-label">{s.label}</p>
                </div>
              ))}
            </div>
            {vsnSel && (
              <div className="info-box">
                <p className="info-row">
                  Email: <strong>{vsnSel.email}</strong>
                </p>
                <p className="info-row">
                  Balance: <strong>${fmt(vsnSel.balance)}</strong>
                </p>
                {vsnSel.pendingWithdrawAmount > 0 && (
                  <p className="info-row">
                    Withdrawal:{" "}
                    <strong style={{ color: "#a78bfa" }}>
                      ${fmt(vsnSel.pendingWithdrawAmount)}
                    </strong>
                  </p>
                )}
                {vsnSel.pendingWithdrawWallet && (
                  <p className="info-row" style={{ wordBreak: "break-all" }}>
                    Wallet:{" "}
                    <strong style={{ color: "#9ca3af", fontSize: "11px" }}>
                      {vsnSel.pendingWithdrawWallet}
                    </strong>
                  </p>
                )}
                <p className="info-row">
                  VSN Status:{" "}
                  <strong
                    style={{
                      color: vsnSel.vsn_verified
                        ? "#22c55e"
                        : vsnSel.vsn_required
                          ? "#f59e0b"
                          : "#6b7280",
                    }}
                  >
                    {vsnSel.vsn_verified
                      ? "Verified"
                      : vsnSel.vsn_required
                        ? "Awaiting Entry"
                        : "Not Sent"}
                  </strong>
                </p>
                {vsnSel.vsn_code && !vsnSel.vsn_verified && (
                  <p className="info-row">
                    Current VSN:{" "}
                    <strong
                      style={{ color: "#f59e0b", letterSpacing: "0.1em" }}
                    >
                      {vsnSel.vsn_code}
                    </strong>
                  </p>
                )}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">VSN Code to Generate</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. VSN-4829-XK"
                value={vsnCode}
                onChange={(e) => {
                  setVsnCode(e.target.value);
                  setVsnErr("");
                }}
                style={{
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              />
              <p className="form-hint">
                <strong>Send this code to the user via support chat</strong>{" "}
                after generating.
              </p>
            </div>
            {vsnErr && <div className="alert alert-error">{vsnErr}</div>}
            {vsnOk && <div className="alert alert-success">{vsnOk}</div>}
            <div className="btn-group">
              <button
                className="btn-primary"
                onClick={handleSendVSN}
                disabled={vsnLoading || !vsnSel}
                style={{
                  background: !vsnSel
                    ? undefined
                    : "linear-gradient(135deg,#7C5CFC,#5b3fd4)",
                  border: "none",
                }}
              >
                {vsnLoading ? (
                  <>
                    <span className="spinner" /> Generating...
                  </>
                ) : (
                  "Generate VSN Code"
                )}
              </button>
              <button className="btn-secondary" onClick={clearVsn}>
                Clear
              </button>
            </div>
          </div>

          {pendingWithdrawals.length > 0 && (
            <div className="card">
              <h2 className="card-title" style={{ margin: "0 0 14px" }}>
                Users with Pending Withdrawals
              </h2>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      {["User", "Balance", "Requested", "VSN Status"].map(
                        (h) => (
                          <th key={h}>{h}</th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingWithdrawals.map((u) => (
                      <tr
                        key={u.uid}
                        onClick={() => {
                          setVsnSel(u);
                          setVsnErr("");
                          setVsnDepositErr("");
                        }}
                      >
                        <td data-label="User">
                          <p
                            style={{
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: 600,
                              margin: 0,
                            }}
                          >
                            {u.email}
                          </p>
                          <p
                            style={{
                              color: "#6b7280",
                              fontSize: "10px",
                              margin: 0,
                            }}
                          >
                            @{u.username || "—"}
                          </p>
                        </td>
                        <td data-label="Balance" className="amount">
                          ${fmt(u.balance)}
                        </td>
                        <td
                          data-label="Requested"
                          className="amount"
                          style={{ color: "#a78bfa" }}
                        >
                          ${fmt(u.pendingWithdrawAmount)}
                        </td>
                        <td data-label="VSN Status">
                          {u.vsn_verified ? (
                            <span className="pill pill-green">Verified</span>
                          ) : u.vsn_required ? (
                            <span className="pill pill-yellow">VSN Sent</span>
                          ) : (
                            <span className="pill pill-purple">Needs VSN</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <AdminHeader title="Admin Dashboard" />

      {users.some((u) => u.pendingTarget) && (
        <div className="alert-banner">
          {users.filter((u) => u.pendingTarget).length} user(s) scheduled — will
          auto-activate after analysis + scheduling gap.
        </div>
      )}
      {pendingWithdrawals.length > 0 && (
        <div
          className="alert-banner"
          style={{
            background: "rgba(124,92,252,0.12)",
            borderColor: "rgba(124,92,252,0.3)",
            color: "#a78bfa",
          }}
        >
          {pendingWithdrawals.length} user(s) waiting for withdrawal support —{" "}
          <span
            style={{ textDecoration: "underline", cursor: "pointer" }}
            onClick={() => setView("vsn")}
          >
            click here to issue a VSN code
          </span>
          .
        </div>
      )}
      {liveProcessingTxns.length > 0 && (
        <div
          className="alert-banner"
          style={{
            background: "rgba(13,148,136,0.1)",
            borderColor: "rgba(13,148,136,0.3)",
            color: "#0d9488",
          }}
        >
          {liveProcessingTxns.length} processing withdrawal(s) awaiting action —{" "}
          <span
            style={{ textDecoration: "underline", cursor: "pointer" }}
            onClick={() => setView("processing")}
          >
            click here to mark successful
          </span>
          .
        </div>
      )}

      <div className="admin-grid">
        {/* ── CARD 1: Fund User ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-badge" style={{ background: "#0d9488" }}>
              1
            </span>
            <h2 className="card-title">Fund User Account</h2>
          </div>
          <div className="form-group">
            <label className="form-label">Select User</label>
            <select
              className="form-select"
              value={fundSel?.uid || ""}
              onChange={(e) => {
                setFundSel(users.find((u) => u.uid === e.target.value) || null);
                setFundErr("");
              }}
            >
              <option value="">Choose a user...</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.email} — ${fmt(u.balance)}{" "}
                  {u.hasBeenFunded ? "(Funded)" : "(New)"}
                </option>
              ))}
            </select>
          </div>
          {fundSel && <UserCard user={fundSel} />}
          <div className="form-group">
            <label className="form-label">Deposit Amount (USD)</label>
            <input
              className="form-input"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 150"
              value={fundAmt}
              onChange={(e) => {
                setFundAmt(e.target.value);
                setFundErr("");
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">OmniDev Analysis Duration</label>
            <div className="input-row">
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                placeholder="hrs"
                value={anaHrs}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) setAnaHrs(e.target.value);
                }}
              />
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                placeholder="mins"
                value={anaMins}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (/^\d*$/.test(e.target.value) && (isNaN(v) || v < 60))
                    setAnaMins(e.target.value);
                }}
              />
            </div>
            <p className="form-hint">
              After this + 2–5 min gap, bot trading begins.
            </p>
          </div>
          {fundErr && <div className="alert alert-error">{fundErr}</div>}
          {fundOk && <div className="alert alert-success">{fundOk}</div>}
          <div className="btn-group">
            <button
              className="btn-primary"
              onClick={handleFund}
              disabled={fundLoading || !fundSel}
            >
              {fundLoading ? (
                <>
                  <span className="spinner" /> Processing...
                </>
              ) : (
                "Fund Account"
              )}
            </button>
            <button className="btn-secondary" onClick={clearFund}>
              Cancel
            </button>
          </div>
        </div>

        {/* ── CARD 2: Set Target & Activate Bot ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-badge" style={{ background: "#065f46" }}>
              2
            </span>
            <h2 className="card-title">Set Target & Activate Bot</h2>
          </div>
          <div className="form-group">
            <label className="form-label">Select Funded User</label>
            <select
              className="form-select"
              value={tgtSel?.uid || ""}
              onChange={(e) => {
                setTgtSel(users.find((u) => u.uid === e.target.value) || null);
                setTgtErr("");
              }}
            >
              <option value="">Choose a funded user...</option>
              {users
                .filter((u) => u.hasBeenFunded)
                .map((u) => {
                  const botExpMs =
                    u.botExpiresAt?.toMillis?.() || u.botExpiresAt || 0;
                  const isExpired = botExpMs && Date.now() > botExpMs;
                  const statusLabel = isExpired
                    ? "(Expired — can re-activate)"
                    : u.botStatus === "activated"
                      ? "(Trading)"
                      : u.botStatus === "scheduled"
                        ? "(Scheduling)"
                        : u.botStatus === "analysing"
                          ? "(Analysing)"
                          : "(Ready)";
                  return (
                    <option key={u.uid} value={u.uid}>
                      {u.email} — ${fmt(u.balance)} {statusLabel}
                    </option>
                  );
                })}
            </select>
          </div>
          {tgtSel?.hasBeenFunded && (
            <div className="info-box">
              <p className="info-row">
                Current Balance: <strong>${fmt(tgtSel.balance)}</strong>
              </p>
              <p className="info-row">
                Initial Deposit: <strong>${fmt(tgtSel.initialBalance)}</strong>
              </p>
              <p className="info-row">
                Status:{" "}
                <strong
                  style={{
                    color: (() => {
                      const botExpMs =
                        tgtSel.botExpiresAt?.toMillis?.() ||
                        tgtSel.botExpiresAt ||
                        0;
                      if (botExpMs && Date.now() > botExpMs) return "#ef4444";
                      if (tgtSel.botStatus === "activated") return "#22c55e";
                      if (tgtSel.botStatus === "scheduled") return "#f59e0b";
                      if (tgtSel.botStatus === "analysing") return "#3b82f6";
                      return "#ef4444";
                    })(),
                  }}
                >
                  {(() => {
                    const botExpMs =
                      tgtSel.botExpiresAt?.toMillis?.() ||
                      tgtSel.botExpiresAt ||
                      0;
                    if (botExpMs && Date.now() > botExpMs)
                      return "Expired — Ready for Re-activation";
                    if (tgtSel.botStatus === "activated")
                      return "Bot Trading Active";
                    if (tgtSel.botStatus === "scheduled")
                      return "Scheduling Soon";
                    if (tgtSel.botStatus === "analysing")
                      return "OmniDev Analysing";
                    return "Disabled";
                  })()}
                </strong>
              </p>
              {tgtSel.analysingExpiresAt && (
                <p className="info-sub">
                  Analysing ends in: {fmtLeft(tgtSel.analysingExpiresAt)}
                </p>
              )}
            </div>
          )}
          <div className="form-group" style={{ marginTop: "14px" }}>
            <label className="form-label">Target Profit Amount (USD)</label>
            <input
              className="form-input"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 2000"
              value={tgtAmt}
              onChange={(e) => {
                setTgtAmt(e.target.value);
                setTgtErr("");
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Bot Trading Duration{" "}
              <span style={{ color: "#22c55e" }}>(trading time)</span>
            </label>
            <div className="input-row">
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                placeholder="hrs"
                value={botHrs}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) setBotHrs(e.target.value);
                }}
              />
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                placeholder="mins"
                value={botMins}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (/^\d*$/.test(e.target.value) && (isNaN(v) || v < 60))
                    setBotMins(e.target.value);
                }}
              />
            </div>
            <p className="form-hint">Enter hours and minutes (e.g. 1h 30m).</p>
            {(parseInt(botHrs) > 0 || parseInt(botMins) > 0) && (
              <p
                style={{
                  marginTop: "6px",
                  fontSize: "12px",
                  color: "#22c55e",
                  fontWeight: 600,
                }}
              >
                Duration: {parseInt(botHrs) > 0 ? `${parseInt(botHrs)}h ` : ""}
                {parseInt(botMins) > 0 ? `${parseInt(botMins)}m` : ""} (
                {(parseInt(botHrs) || 0) * 60 + (parseInt(botMins) || 0)} mins
                total)
              </p>
            )}
          </div>
          {tgtSel?.hasBeenFunded && tgtAmt && parseFloat(tgtAmt) > 0 && (
            <div className="preview-box">
              <p className="preview-title">Growth Preview</p>
              <p className="preview-text">
                ${fmt(tgtSel.balance)} → $
                {fmt(tgtSel.balance + parseFloat(tgtAmt))} over {botHrs}h{" "}
                {botMins}m
                <br />
                <span className="preview-sub">
                  = ${fmt(tgtSel.balance)} current + ${fmt(parseFloat(tgtAmt))}{" "}
                  profit
                </span>
              </p>
            </div>
          )}
          {tgtErr && <div className="alert alert-error">{tgtErr}</div>}
          {tgtOk && <div className="alert alert-success">{tgtOk}</div>}
          <div className="btn-group">
            <button
              className="btn-primary"
              onClick={handleTarget}
              disabled={tgtLoading || !tgtSel?.hasBeenFunded}
            >
              {tgtLoading ? (
                <>
                  <span className="spinner" /> Processing...
                </>
              ) : (
                "Set Target & Activate Bot"
              )}
            </button>
            <button className="btn-secondary" onClick={clearTgt}>
              Cancel
            </button>
          </div>
        </div>

        {/* ── All Users Table ── */}
        <div className="card admin-grid-full">
          <h2 className="card-title" style={{ margin: "0 0 14px" }}>
            All Users ({users.length})
          </h2>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {[
                    "User",
                    "Balance",
                    "Target",
                    "Status",
                    "Withdraw",
                    "Time Left",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const s = getBotStatus(u);
                    return (
                      <tr
                        key={u.uid}
                        onClick={() => {
                          setFundSel(u);
                          setWfSel(u);
                          if (u.hasBeenFunded) setTgtSel(u);
                        }}
                      >
                        <td data-label="User">
                          <div className="table-user">
                            <div className="table-avatar">
                              {u.picture ? (
                                <img src={u.picture} alt="" />
                              ) : (
                                (u.firstName?.[0] || u.email[0]).toUpperCase()
                              )}
                            </div>
                            <div className="table-user-info">
                              <p className="table-user-email">{u.email}</p>
                              <p className="table-user-handle">
                                @{u.username || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td data-label="Balance" className="amount">
                          ${fmt(u.balance)}
                        </td>
                        <td data-label="Target" className="amount">
                          {u.targetAmount > 0 ? `$${fmt(u.targetAmount)}` : "—"}
                        </td>
                        <td data-label="Status">
                          <span
                            className="table-status"
                            style={{ color: s.color }}
                          >
                            <span
                              className="table-status-dot"
                              style={{ background: s.dot }}
                            />
                            {s.text}
                          </span>
                        </td>
                        <td data-label="Withdraw">
                          {u.withdrawalStatus === "pending_support" ? (
                            <span
                              className="pill pill-purple"
                              style={{ cursor: "pointer" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setView("vsn");
                              }}
                            >
                              Pending
                            </span>
                          ) : u.vsn_required && !u.vsn_verified ? (
                            <span className="pill pill-yellow">VSN Sent</span>
                          ) : u.vsn_verified ? (
                            <span className="pill pill-green">Verified</span>
                          ) : (
                            <span
                              style={{ color: "#6b7280", fontSize: "11px" }}
                            >
                              —
                            </span>
                          )}
                        </td>
                        <td data-label="Time Left" className="time-left">
                          {u.botExpiresAt
                            ? fmtLeft(u.botExpiresAt)
                            : u.scheduleActivateAt
                              ? `~${fmtLeft(u.scheduleActivateAt)}`
                              : u.analysingExpiresAt
                                ? fmtLeft(u.analysingExpiresAt)
                                : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Transactions Table ── */}
      <div className="card txn-card">
        <div className="txn-card-header">
          <div className="txn-card-title-row">
            <h2 className="card-title" style={{ margin: 0 }}>
              Recent Funding Transactions
            </h2>
            <span className="txn-count-badge">
              {filteredTxns.length} total · {visibleTxns.length} shown
            </span>
          </div>
          <div className="txn-filters">
            <select
              className="txn-filter-select"
              value={txnFilterYear}
              onChange={(e) => {
                setTxnFilterYear(e.target.value);
                setTxnPage(1);
              }}
            >
              <option value="all">All Years</option>
              {getAvailableYears().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              className="txn-filter-select"
              value={txnFilterMonth}
              onChange={(e) => {
                setTxnFilterMonth(e.target.value);
                setTxnPage(1);
              }}
            >
              <option value="all">All Months</option>
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filteredTxns.length === 0 ? (
          <p
            style={{ color: "#6b7280", textAlign: "center", padding: "28px 0" }}
          >
            No transactions for the selected period.
          </p>
        ) : (
          <div className="table-wrap">
            <div
              className="txn-scroll-area"
              ref={txnScrollRef}
              onScroll={handleTxnScroll}
            >
              <table className="admin-table">
                <thead>
                  <tr>
                    {[
                      "User",
                      "Type",
                      "Amount",
                      "Detail",
                      "Hrs",
                      "Status",
                      "Date",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>{txnRows}</tbody>
              </table>
              {txnLoadingMore && (
                <div className="txn-load-more">
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #333",
                      borderTop: "2px solid #0d9488",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  Loading more transactions...
                </div>
              )}
              {!txnLoadingMore && hasMore && (
                <div
                  className="txn-load-more"
                  style={{ color: "#4b5563", fontSize: "11px" }}
                >
                  Scroll to load more (
                  {filteredTxns.length - visibleTxns.length} remaining)
                </div>
              )}
              {!hasMore && filteredTxns.length > 0 && (
                <div
                  className="txn-load-more"
                  style={{ color: "#374151", fontSize: "11px" }}
                >
                  All {filteredTxns.length} transactions loaded
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
