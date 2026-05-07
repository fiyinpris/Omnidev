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

  while (remaining > 0.005) {
    const maxChunk = Math.min(remaining, 700);
    const minChunk = Math.min(remaining, 50);
    let chunk =
      maxChunk <= 50.005
        ? maxChunk
        : Math.round((minChunk + Math.random() * (maxChunk - minChunk)) * 100) /
          100;
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

// Style constants
const SEL = {
  width: "100%",
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "10px",
  padding: "12px 36px 12px 14px",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' strokeWidth='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
};
const INP = {
  width: "100%",
  boxSizing: "border-box",
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "10px",
  padding: "12px 14px",
  color: "#fff",
  fontSize: "15px",
  outline: "none",
};
const LBL = {
  display: "block",
  color: "#9ca3af",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "8px",
};
const CARD = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "16px",
  padding: "20px",
  boxSizing: "border-box",
};
const BTN_P = {
  padding: "14px",
  background: "#0d9488",
  border: "none",
  borderRadius: "10px",
  color: "#fff",
  fontWeight: 700,
  fontSize: "14px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  flex: 1,
};
const BTN_C = {
  padding: "14px 20px",
  background: "transparent",
  border: "1px solid #333",
  borderRadius: "10px",
  color: "#9ca3af",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
};
const SPIN = {
  width: "16px",
  height: "16px",
  border: "2px solid rgba(255,255,255,.3)",
  borderTop: "2px solid #fff",
  borderRadius: "50%",
  animation: "spin .7s linear infinite",
  display: "inline-block",
};
const TH = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#fff",
  whiteSpace: "nowrap",
};
const SC = {
  completed: { bg: "rgba(13,148,136,.15)", text: "#0d9488" },
  trading: { bg: "rgba(34,197,94,.15)", text: "#22c55e" },
  analysing: { bg: "rgba(59,130,246,.15)", text: "#3b82f6" },
  scheduled: { bg: "rgba(245,158,11,.15)", text: "#f59e0b" },
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

        await setDoc(doc(collection(db, "adminTransactions")), {
          userId: user.uid,
          userEmail: user.email,
          userName:
            `${user.firstName} ${user.lastName}`.trim() || user.username,
          type: "target_activated",
          timestamp: nowTs,
          status: "trading",
          botExpiresAt,
          targetAmount: target,
          botHours: hours,
          initialAmount: user.initialBalance,
          adminEmail: adminUser.email,
          note: "Auto-activated after analysing + scheduling gap",
        });
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
    // Admin sets duration freely — no forced minimum
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
        analysingDurationMs: anaMs, // store duration for display
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
        // Pending — CF / polling will activate after analysing ends
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
          type: "target_set",
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
        // Activate immediately with full-window schedule
        const botExpiresAt = Timestamp.fromMillis(
          now.toMillis() + hours * 3600000,
        );
        const schedule = generateIncrements(target, hours);
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
          type: "target_set",
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
    // Simplified: both analysing and pending-target show same status
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
    if (t.type === "target_set" || t.type === "target_activated") {
      if (liveSt === "disabled") return "completed";
      const exp = t.botExpiresAt?.toMillis?.() || t.botExpiresAt;
      if (exp && now >= exp) return "completed";
      if (exp && now < exp) return "trading";
      if (liveSt === "activated") return "trading";
      if (liveSt === "scheduled") return "scheduled";
      return "scheduled";
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

  // ── User info card (shared between step 1 and 2) ─────────────────────────────
  const UserCard = ({ user }) => {
    const s = getBotStatus(user);
    return (
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: "12px",
          padding: "14px 16px",
          marginBottom: "16px",
          border: "1px solid #2a2a2a",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#0d9488",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {user.picture ? (
              <img
                src={user.picture}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              (user.firstName?.[0] || user.email[0]).toUpperCase()
            )}
          </div>
          <div>
            <p
              style={{
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                margin: 0,
              }}
            >
              {user.firstName} {user.lastName}
            </p>
            <p style={{ color: "#6b7280", fontSize: "12px", margin: 0 }}>
              @{user.username || "no username"}
            </p>
          </div>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: s.color,
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: s.dot,
              display: "inline-block",
            }}
          />
          {s.text}
        </span>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#fff",
        padding: "16px",
        fontFamily:
          '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .ag{display:grid;grid-template-columns:1fr;gap:16px}
        @media(min-width:640px){.ag{grid-template-columns:1fr 1fr;gap:20px}.af{grid-column:1/-1}}
        .at{width:100%;border-collapse:collapse;min-width:560px}
        .aw{overflow-x:auto;-webkit-overflow-scrolling:touch}
        .ab{display:flex;gap:10px;flex-wrap:wrap}
        .ab button{flex:1;min-width:110px}
        .tr2{display:flex;gap:10px}
        @media(max-width:480px){.tr2{flex-direction:column}.ah{flex-direction:column;align-items:flex-start}}
      `}</style>

      {/* Header */}
      <header
        className="ah"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid #1a1a1a",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#0d9488",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h1
              style={{
                color: "#fff",
                fontSize: "clamp(17px,4vw,22px)",
                fontWeight: 800,
                margin: 0,
              }}
            >
              Admin Dashboard
            </h1>
            <p
              style={{ color: "#6b7280", fontSize: "13px", margin: "2px 0 0" }}
            >
              {adminUser?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "10px 20px",
            background: "transparent",
            border: "1px solid #333",
            borderRadius: "10px",
            color: "#9ca3af",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Back to Site
        </button>
      </header>

      {users.some((u) => u.pendingTarget) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(245,158,11,.08)",
            border: "1px solid rgba(245,158,11,.25)",
            borderRadius: "10px",
            padding: "10px 16px",
            color: "#f59e0b",
            fontSize: "13px",
            marginBottom: "20px",
          }}
        >
          🟡 {users.filter((u) => u.pendingTarget).length} user(s) scheduled —
          will auto-activate after analysis + scheduling gap.
        </div>
      )}

      <div className="ag">
        {/* ── STEP 1: Fund ── */}
        <div style={CARD}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "#0d9488",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              1
            </span>
            <h2
              style={{
                color: "#fff",
                fontSize: "17px",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Fund User Account
            </h2>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={LBL}>Select User</label>
            <select
              value={fundSel?.uid || ""}
              onChange={(e) => {
                setFundSel(users.find((u) => u.uid === e.target.value) || null);
                setFundErr("");
              }}
              style={SEL}
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

          <div style={{ marginBottom: "16px" }}>
            <label style={LBL}>Deposit Amount (USD)</label>
            <input
              type="number"
              min="0.01"
              step="any"
              placeholder="e.g. 150"
              value={fundAmt}
              onChange={(e) => {
                setFundAmt(e.target.value);
                setFundErr("");
              }}
              style={INP}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={LBL}>
              OmniDev Analysis Duration{" "}
              <span
                style={{
                  color: "#3b82f6",
                  textTransform: "none",
                  fontWeight: 400,
                }}
              >
                (set by admin)
              </span>
            </label>
            <div className="tr2">
              <select
                value={anaHrs}
                onChange={(e) => setAnaHrs(e.target.value)}
                style={{ ...SEL, flex: 1 }}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i} hr{i !== 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              <select
                value={anaMins}
                onChange={(e) => setAnaMins(e.target.value)}
                style={{ ...SEL, flex: 1 }}
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <option key={m} value={m}>
                    {m} min{m !== 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
            <p
              style={{ color: "#6b7280", fontSize: "11px", margin: "6px 0 0" }}
            >
              Admin controls how long OmniDev analyses. After this + 2–5 min
              gap, bot trading begins.
            </p>
          </div>

          {fundErr && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                background: "rgba(239,68,68,.08)",
                border: "1px solid rgba(239,68,68,.25)",
                color: "#f87171",
                marginBottom: "12px",
              }}
            >
              {fundErr}
            </div>
          )}
          {fundOk && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                background: "rgba(13,148,136,.08)",
                border: "1px solid rgba(13,148,136,.25)",
                color: "#0d9488",
                marginBottom: "12px",
              }}
            >
              {fundOk}
            </div>
          )}

          <div className="ab">
            <button
              onClick={handleFund}
              disabled={fundLoading || !fundSel}
              style={{
                ...BTN_P,
                opacity: fundLoading || !fundSel ? 0.6 : 1,
                cursor: fundLoading || !fundSel ? "not-allowed" : "pointer",
              }}
            >
              {fundLoading ? (
                <>
                  <span style={SPIN} /> Processing...
                </>
              ) : (
                "Fund Account"
              )}
            </button>
            <button onClick={clearFund} style={BTN_C}>
              Cancel
            </button>
          </div>
        </div>

        {/* ── STEP 2: Target ── */}
        <div style={CARD}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "#065f46",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              2
            </span>
            <h2
              style={{
                color: "#fff",
                fontSize: "17px",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Set Target &amp; Activate Bot
            </h2>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={LBL}>Select Funded User</label>
            <select
              value={tgtSel?.uid || ""}
              onChange={(e) => {
                setTgtSel(users.find((u) => u.uid === e.target.value) || null);
                setTgtErr("");
              }}
              style={SEL}
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
            <div
              style={{
                background: "#1a1a1a",
                borderRadius: "12px",
                padding: "14px 16px",
                marginBottom: "16px",
                border: "1px solid #2a2a2a",
              }}
            >
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "13px",
                  margin: "0 0 4px",
                }}
              >
                Balance:{" "}
                <strong style={{ color: "#fff" }}>
                  ${fmt(tgtSel.balance)}
                </strong>
              </p>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "13px",
                  margin: "0 0 4px",
                }}
              >
                Initial Deposit:{" "}
                <strong style={{ color: "#fff" }}>
                  ${fmt(tgtSel.initialBalance)}
                </strong>
              </p>
              <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
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
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    margin: "4px 0 0",
                  }}
                >
                  Analysing ends in: {fmtLeft(tgtSel.analysingExpiresAt)}
                </p>
              )}
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={LBL}>Target Profit Amount (USD)</label>
            <input
              type="number"
              min="0.01"
              step="any"
              placeholder="e.g. 2000"
              value={tgtAmt}
              onChange={(e) => {
                setTgtAmt(e.target.value);
                setTgtErr("");
              }}
              style={INP}
            />
            <p
              style={{ color: "#6b7280", fontSize: "12px", margin: "6px 0 0" }}
            >
              Profit added in random $50–$700 drops. Full amount guaranteed by
              end of trading window.
            </p>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={LBL}>
              Bot Trading Duration{" "}
              <span
                style={{
                  color: "#22c55e",
                  textTransform: "none",
                  fontWeight: 400,
                }}
              >
                (how long the bot trades)
              </span>
            </label>
            <select
              value={botHrs}
              onChange={(e) => setBotHrs(e.target.value)}
              style={SEL}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 12, 24, 48, 72].map((h) => (
                <option key={h} value={h}>
                  {h} hour{h > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {tgtSel?.hasBeenFunded && tgtAmt && parseFloat(tgtAmt) > 0 && (
            <div
              style={{
                background: "rgba(13,148,136,.06)",
                border: "1px solid rgba(13,148,136,.2)",
                borderRadius: "10px",
                padding: "14px 16px",
                marginBottom: "16px",
              }}
            >
              <p
                style={{
                  color: "#0d9488",
                  fontSize: "13px",
                  fontWeight: 700,
                  margin: "0 0 6px",
                }}
              >
                📈 Growth Preview
              </p>
              <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
                ${fmt(tgtSel.initialBalance)} → $
                {fmt(tgtSel.initialBalance + parseFloat(tgtAmt))} over {botHrs}h
                <br />
                <span style={{ color: "#6b7280", fontSize: "12px" }}>
                  = ${fmt(tgtSel.initialBalance)} initial + $
                  {fmt(parseFloat(tgtAmt))} profit (scattered drops, all
                  guaranteed)
                </span>
              </p>
            </div>
          )}

          {tgtErr && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                background: "rgba(239,68,68,.08)",
                border: "1px solid rgba(239,68,68,.25)",
                color: "#f87171",
                marginBottom: "12px",
              }}
            >
              {tgtErr}
            </div>
          )}
          {tgtOk && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                background: "rgba(13,148,136,.08)",
                border: "1px solid rgba(13,148,136,.25)",
                color: "#0d9488",
                marginBottom: "12px",
              }}
            >
              {tgtOk}
            </div>
          )}

          <div className="ab">
            <button
              onClick={handleTarget}
              disabled={tgtLoading || !tgtSel?.hasBeenFunded}
              style={{
                ...BTN_P,
                opacity: tgtLoading || !tgtSel?.hasBeenFunded ? 0.6 : 1,
                cursor:
                  tgtLoading || !tgtSel?.hasBeenFunded
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {tgtLoading ? (
                <>
                  <span style={SPIN} /> Processing...
                </>
              ) : (
                "Set Target & Activate Bot"
              )}
            </button>
            <button onClick={clearTgt} style={BTN_C}>
              Cancel
            </button>
          </div>
        </div>

        {/* ── All Users table ── */}
        <div className="af" style={CARD}>
          <h2
            style={{
              color: "#fff",
              fontSize: "17px",
              fontWeight: 700,
              margin: "0 0 16px",
            }}
          >
            👥 All Users ({users.length})
          </h2>
          <div
            className="aw"
            style={{
              maxHeight: "480px",
              overflowY: "auto",
              borderRadius: "12px",
              border: "1px solid #222",
            }}
          >
            <table className="at">
              <thead>
                <tr style={{ background: "#0d9488" }}>
                  {["User", "Balance", "Target", "Status", "Time Left"].map(
                    (h) => (
                      <th key={h} style={TH}>
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
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
                        style={{
                          borderBottom: "1px solid #1a1a1a",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#1a1a1a")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                                background: "#0d9488",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "12px",
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                            >
                              {u.picture ? (
                                <img
                                  src={u.picture}
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                (u.firstName?.[0] || u.email[0]).toUpperCase()
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p
                                style={{
                                  color: "#fff",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  margin: 0,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "170px",
                                }}
                              >
                                {u.email}
                              </p>
                              <p
                                style={{
                                  color: "#6b7280",
                                  fontSize: "11px",
                                  margin: 0,
                                }}
                              >
                                @{u.username || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "13px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ${fmt(u.balance)}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: u.targetAmount > 0 ? "#0d9488" : "#6b7280",
                            fontWeight: 700,
                            fontSize: "13px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {u.targetAmount > 0 ? `$${fmt(u.targetAmount)}` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              color: s.color,
                              fontSize: "12px",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: s.dot,
                                display: "inline-block",
                                flexShrink: 0,
                              }}
                            />
                            {s.text}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: "#6b7280",
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
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
      <div style={{ ...CARD, marginTop: "24px" }}>
        <h2
          style={{
            color: "#fff",
            fontSize: "17px",
            fontWeight: 700,
            margin: "0 0 16px",
          }}
        >
          📊 Recent Funding Transactions
        </h2>
        {txns.length === 0 ? (
          <p
            style={{ color: "#6b7280", textAlign: "center", padding: "40px 0" }}
          >
            No transactions yet.
          </p>
        ) : (
          <div
            className="aw"
            style={{
              maxHeight: "480px",
              overflowY: "auto",
              borderRadius: "12px",
              border: "1px solid #222",
            }}
          >
            <table className="at" style={{ minWidth: "640px" }}>
              <thead>
                <tr style={{ background: "#0d9488" }}>
                  {[
                    "User",
                    "Type",
                    "Amount",
                    "Target",
                    "Hours",
                    "Status",
                    "Date",
                  ].map((h) => (
                    <th key={h} style={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => {
                  const ls = getTxnStatus(t);
                  const sc = SC[ls] || SC.completed;

                  // Type label logic
                  let typeLabel = t.type;
                  if (t.type === "initial_fund") {
                    typeLabel =
                      ls === "analysing"
                        ? `OmniDev Analysing (${fmtDuration(t.analysingDurationMs)})`
                        : "OmniDev Deposit";
                  } else if (t.type === "target_activated") {
                    typeLabel = "Auto-Activated";
                  } else if (t.type === "target_set") {
                    if (ls === "trading") typeLabel = "Bot Trading Active";
                    else if (ls === "scheduled") typeLabel = "Scheduled";
                    else typeLabel = "Bot Done";
                  }

                  return (
                    <tr
                      key={t.id}
                      style={{ borderBottom: "1px solid #1a1a1a" }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <p
                          style={{
                            color: "#fff",
                            fontSize: "13px",
                            fontWeight: 600,
                            margin: 0,
                          }}
                        >
                          {t.userName || t.userEmail}
                        </p>
                        <p
                          style={{
                            color: "#6b7280",
                            fontSize: "11px",
                            margin: 0,
                          }}
                        >
                          {t.userEmail}
                        </p>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            background: "rgba(13,148,136,.15)",
                            color: "#0d9488",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {typeLabel}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#0d9488",
                          fontWeight: 700,
                          fontSize: "13px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        +${fmt(t.amount || t.initialAmount || 0)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#0d9488",
                          fontWeight: 700,
                          fontSize: "13px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.targetAmount ? `$${fmt(t.targetAmount)}` : "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#0d9488",
                          fontSize: "13px",
                        }}
                      >
                        {t.botHours ? `${t.botHours}h` : "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            background: sc.bg,
                            color: sc.text,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            textTransform: "capitalize",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ls}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#9ca3af",
                          fontSize: "12px",
                          whiteSpace: "nowrap",
                        }}
                      >
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
