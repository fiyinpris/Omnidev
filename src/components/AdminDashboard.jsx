import { useEffect, useState, useRef, useCallback } from "react";
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
const TXN_PAGE_SIZE = 25;

const fmt = (val) => {
  if (val === undefined || val === null) return "0.00";
  const n = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(n) || Object.is(n, -0)) return "0.00";
  const s = n.toFixed(10),
    [int, dec] = s.split(".");
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec.substring(0, 2)}`;
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
};

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("main"); // "main" | "vsn" | "wallet_failed"

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
  const [tgtLoading, setTgtLoading] = useState(false);
  const [tgtOk, setTgtOk] = useState("");
  const [tgtErr, setTgtErr] = useState("");

  const [wfSel, setWfSel] = useState(null);
  const [wfNote, setWfNote] = useState("");
  const [wfLoading, setWfLoading] = useState(false);
  const [wfOk, setWfOk] = useState("");
  const [wfErr, setWfErr] = useState("");

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

  // ── FIX: stable "now" that only updates every 60 s, not every render ──
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
        };
      });
      setUsers(list);
      setFundSel((p) => (p ? list.find((u) => u.uid === p.uid) || p : null));
      setTgtSel((p) => (p ? list.find((u) => u.uid === p.uid) || p : null));
      setVsnSel((p) => (p ? list.find((u) => u.uid === p.uid) || p : null));
      setWfSel((p) => (p ? list.find((u) => u.uid === p.uid) || p : null));
    });
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
        description: `Initial deposit $${fmt(amount)}`,
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
          note: "Will auto-activate after analysing completes + grace period",
        });
        setTgtOk(
          `Scheduled! $${fmt(tgtSel.initialBalance)} → $${fmt(tgtSel.initialBalance + target)} over ${hours}h.`,
        );
      } else {
        const botExpiresAt = Timestamp.fromMillis(
          now.toMillis() + hours * 3600000,
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
          incrementSchedule: [],
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
          `Bot activated! $${fmt(tgtSel.initialBalance)} → $${fmt(tgtSel.initialBalance + target)} over ${hours}h.`,
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
      setVsnOk(
        `VSN "${vsnCode.trim()}" generated for ${vsnSel.email}. Send via support chat.`,
      );
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

  // ── FIX: getTxnStatus now uses stable `nowMs` instead of Date.now() ──
  // This prevents the table from re-rendering/jumping every tick.
  const getTxnStatus = useCallback(
    (t) => {
      const now = nowMs;
      const live = users.find((u) => u.uid === t.userId);
      const liveSt = live?.botStatus || "disabled";
      if (t.type === "wallet_failed") return "wallet_failed";
      if (t.type === "vsn_request") {
        if (live?.vsn_verified) return "completed";
        if (live?.vsn_required) return "analysing";
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
  };
  const clearVsn = () => {
    setVsnSel(null);
    setVsnCode("");
    setVsnErr("");
    setVsnOk("");
  };
  const clearWf = () => {
    setWfSel(null);
    setWfNote("");
    setWfErr("");
    setWfOk("");
  };

  /* ── Loading screen ── */
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

  /* ── Reusable sub-components ── */
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

  /* ── Shared header ── */
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
              setView("main");
            }}
          >
            ← Back to Dashboard
          </button>
        ) : (
          <>
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

  /* ══════════════════════════════════════
     WALLET FAILED VIEW
  ══════════════════════════════════════ */
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
                    {u.walletConnectionFailed ? " ⚠ Prev. Failed" : ""}
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
                      ⚠ Previously flagged as wallet failed
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
                      style={{ flexShrink: 0 }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
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

  /* ══════════════════════════════════════
     VSN VIEW
  ══════════════════════════════════════ */
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
                }}
              >
                <option value="">Choose a user...</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.email} — ${fmt(u.balance)}
                    {u.withdrawalStatus === "pending_support"
                      ? " 🟣 Withdrawal Pending"
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

  /* ══════════════════════════════════════
     MAIN VIEW
  ══════════════════════════════════════ */
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

          <div className="form-group" style={{ marginTop: "14px" }}>
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
              <span style={{ color: "#22c55e" }}>(trading time)</span>
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
                  {fmt(parseFloat(tgtAmt))} profit
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

        {/* ── All Users — full width ── */}
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

      {/* ── Transactions ── */}
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
                <tbody>
                  {visibleTxns.map((t) => {
                    // ── FIX: call memoized getTxnStatus so it doesn't re-compute on every render tick ──
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
                          : STATUS_COLORS[ls] || STATUS_COLORS.completed;

                    let typeLabel = t.type;
                    if (t.type === "wallet_failed") typeLabel = "Wallet Failed";
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
                          : "OmniDev Deposit";
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
                        <td data-label="Type">
                          <span
                            className="txn-badge"
                            style={{
                              background: colors.bg,
                              color: colors.text,
                            }}
                          >
                            {typeLabel}
                          </span>
                        </td>
                        <td data-label="Amount" className="amount">
                          {t.type === "vsn_request" ||
                          t.type === "wallet_failed" ? (
                            <span style={{ color: "#6b7280" }}>—</span>
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
                          <span
                            className="txn-badge"
                            style={{
                              background: colors.bg,
                              color: colors.text,
                            }}
                          >
                            {ls === "wallet_failed" ? "failed" : ls}
                          </span>
                        </td>
                        <td data-label="Date" className="date-cell">
                          {t.timestamp.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
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
