import { useEffect, useState } from "react";
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
  Timestamp,
} from "firebase/firestore";

const ADMIN_EMAIL = "fiyinolaleke@gmail.com";

const formatMoney = (val) => {
  if (val === undefined || val === null) return "0.00";
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const [fundAmount, setFundAmount] = useState("");
  const [analysingHours, setAnalysingHours] = useState("0");
  const [analysingMins, setAnalysingMins] = useState("45");
  const [fundLoading, setFundLoading] = useState(false);
  const [fundSuccess, setFundSuccess] = useState("");
  const [fundError, setFundError] = useState("");

  const [targetAmount, setTargetAmount] = useState("");
  const [botHours, setBotHours] = useState("1");
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetSuccess, setTargetSuccess] = useState("");
  const [targetError, setTargetError] = useState("");

  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        navigate("/");
        return;
      }
      setAdminUser(user);
      await fetchUsers();
      await fetchTransactions();
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const profilesSnap = await getDocs(collection(db, "profiles"));
      const profilesMap = {};
      profilesSnap.docs.forEach((d) => {
        profilesMap[d.id] = d.data();
      });
      const usersList = usersSnap.docs.map((d) => {
        const data = d.data();
        const profile = profilesMap[d.id] || {};
        return {
          uid: d.id,
          email: data.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          username: profile.username || data.username || "",
          picture: profile.picture || null,
          balance: data.balance || 0,
          initialBalance: data.initialBalance || 0,
          botActive: data.botActive || false,
          botExpiresAt: data.botExpiresAt || null,
          analysingExpiresAt: data.analysingExpiresAt || null,
          botStatus: data.botStatus || "disabled",
          targetAmount: data.targetAmount || 0,
          botHours: data.botHours || 0,
          hasBeenFunded: data.hasBeenFunded || false,
          botActivatedAt: data.botActivatedAt || null,
        };
      });
      setUsers(usersList);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const q = query(
        collection(db, "adminTransactions"),
        orderBy("timestamp", "desc"),
      );
      const snap = await getDocs(q);
      setTransactions(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          timestamp: d.data().timestamp?.toDate?.() || new Date(),
        })),
      );
    } catch (err) {
      console.error("Fetch transactions error:", err);
    }
  };

  const handleCancelFund = () => {
    setSelectedUser(null);
    setFundAmount("");
    setFundError("");
    setFundSuccess("");
  };

  const handleCancelTarget = () => {
    setSelectedUser(null);
    setTargetAmount("");
    setBotHours("1");
    setTargetError("");
    setTargetSuccess("");
  };

  const handleFundUser = async () => {
    // Parse exact value — no rounding
    const rawAmount = fundAmount.trim();
    const amount = parseFloat(rawAmount);

    if (!selectedUser || !rawAmount || isNaN(amount) || amount <= 0) {
      setFundError("Please select a user and enter a valid deposit amount.");
      return;
    }

    const now = Timestamp.now();
    const totalAnalysingMs =
      (parseInt(analysingHours) || 0) * 60 * 60 * 1000 +
      (parseInt(analysingMins) || 0) * 60 * 1000;
    // Default to 45 min if both are 0
    const analysingMs =
      totalAnalysingMs > 0 ? totalAnalysingMs : 45 * 60 * 1000;
    const analysingExpiresAt = Timestamp.fromMillis(
      now.toMillis() + analysingMs,
    );

    setFundLoading(true);
    setFundError("");
    setFundSuccess("");

    try {
      const userRef = doc(db, "users", selectedUser.uid);

      await updateDoc(userRef, {
        balance: amount,
        initialBalance: amount,
        hasBeenFunded: true,
        botActive: true,
        botStatus: "analysing",
        targetAmount: 0,
        botHours: 0,
        botActivatedAt: now,
        botExpiresAt: null,
        analysingExpiresAt: analysingExpiresAt,
        lastFundedAt: now,
        lastFundedAmount: amount,
      });

      // Admin transaction — status starts as "analysing"
      const txnRef = doc(collection(db, "adminTransactions"));
      await setDoc(txnRef, {
        userId: selectedUser.uid,
        userEmail: selectedUser.email,
        userName:
          `${selectedUser.firstName} ${selectedUser.lastName}`.trim() ||
          selectedUser.username,
        amount,
        type: "initial_fund",
        timestamp: now,
        status: "analysing",
        adminEmail: adminUser.email,
        analysingExpiresAt: analysingExpiresAt,
      });

      // User-facing transaction
      const userTxnRef = doc(
        collection(db, "users", selectedUser.uid, "transactions"),
      );
      await setDoc(userTxnRef, {
        type: "deposit",
        amount,
        source: "admin",
        status: "completed",
        timestamp: now,
        description: `Admin funded $${formatMoney(amount)} — Initial deposit`,
      });

      setFundSuccess(
        `Successfully funded $${formatMoney(amount)} to ${selectedUser.email}. OmniDev is now analysing the market.`,
      );
      setFundAmount("");
      setSelectedUser(null);
      await fetchUsers();
      await fetchTransactions();
      setTimeout(() => setFundSuccess(""), 6000);
    } catch (err) {
      console.error("Fund error:", err);
      setFundError("Failed to fund user. Please try again.");
    } finally {
      setFundLoading(false);
    }
  };

  const handleSetTarget = async () => {
    const rawTarget = targetAmount.trim();
    const target = parseFloat(rawTarget);
    const hours = parseInt(botHours) || 1;

    if (!selectedUser) {
      setTargetError("Please select a user.");
      return;
    }
    if (!selectedUser.hasBeenFunded) {
      setTargetError("This user hasn't been funded yet. Fund them first.");
      return;
    }
    if (!rawTarget || isNaN(target) || target <= selectedUser.initialBalance) {
      setTargetError(
        `Target must be greater than initial deposit ($${formatMoney(selectedUser.initialBalance)}).`,
      );
      return;
    }

    const now = Timestamp.now();
    const tradingMs = hours * 60 * 60 * 1000;
    const botExpiresAt = Timestamp.fromMillis(now.toMillis() + tradingMs);

    setTargetLoading(true);
    setTargetError("");
    setTargetSuccess("");

    try {
      const userRef = doc(db, "users", selectedUser.uid);

      await updateDoc(userRef, {
        targetAmount: target,
        botActive: true,
        botStatus: "activated",
        botActivatedAt: now,
        botExpiresAt: botExpiresAt,
        botHours: hours,
        lastTargetSetAt: now,
      });

      // Admin transaction — status starts as "trading"
      const txnRef = doc(collection(db, "adminTransactions"));
      await setDoc(txnRef, {
        userId: selectedUser.uid,
        userEmail: selectedUser.email,
        userName:
          `${selectedUser.firstName} ${selectedUser.lastName}`.trim() ||
          selectedUser.username,
        initialAmount: selectedUser.initialBalance,
        targetAmount: target,
        botHours: hours,
        type: "target_set",
        timestamp: now,
        status: "trading",
        botExpiresAt: botExpiresAt,
        adminEmail: adminUser.email,
      });

      setTargetSuccess(
        `Target set! $${formatMoney(selectedUser.initialBalance)} → $${formatMoney(target)} over ${hours}h. Bot Trading Activated.`,
      );
      setTargetAmount("");
      setBotHours("1");
      setSelectedUser(null);
      await fetchUsers();
      await fetchTransactions();
      setTimeout(() => setTargetSuccess(""), 6000);
    } catch (err) {
      console.error("Target set error:", err);
      setTargetError("Failed to set target. Please try again.");
    } finally {
      setTargetLoading(false);
    }
  };

  const getBotStatusDisplay = (user) => {
    if (!user.hasBeenFunded) {
      return { text: "Not Funded", color: "#6b7280", dotColor: "#6b7280" };
    }

    const now = Date.now();
    const expiresAt = user.botExpiresAt?.toMillis?.() || user.botExpiresAt;
    const analysingExpiresAt =
      user.analysingExpiresAt?.toMillis?.() || user.analysingExpiresAt;

    // Phase 3: everything expired
    if (expiresAt && now > expiresAt) {
      return {
        text: "Bot Trading Disabled",
        color: "#ef4444",
        dotColor: "#ef4444",
      };
    }

    // Phase 2: target set, trading active
    if (expiresAt && now <= expiresAt) {
      return {
        text: "Bot Trading Activated",
        color: "#0d9488",
        dotColor: "#0d9488",
      };
    }

    // Phase 1: funded, analysing
    if (analysingExpiresAt && now <= analysingExpiresAt) {
      return {
        text: "OmniDev Analysing Market",
        color: "#0d9488",
        dotColor: "#0d9488",
        analysing: true,
      };
    }

    // Analysing done but no target yet
    if (user.hasBeenFunded && !expiresAt) {
      return {
        text: "OmniDev Analysing Market",
        color: "#0d9488",
        dotColor: "#0d9488",
        analysing: true,
      };
    }

    return {
      text: "Bot Trading Disabled",
      color: "#ef4444",
      dotColor: "#ef4444",
    };
  };

  const getTransactionStatusDisplay = (t) => {
    const now = Date.now();
    if (t.type === "initial_fund") {
      const analysingExpires =
        t.analysingExpiresAt?.toMillis?.() || t.analysingExpiresAt;
      if (analysingExpires && now < analysingExpires) return "analysing";
      return "completed";
    }
    if (t.type === "target_set") {
      const botExpires = t.botExpiresAt?.toMillis?.() || t.botExpiresAt;
      if (botExpires && now < botExpires) return "trading";
      return "completed";
    }
    return t.status || "completed";
  };

  const formatTimeLeft = (ts) => {
    if (!ts) return "";
    const ms = (ts.toMillis?.() || ts) - Date.now();
    if (ms <= 0) return "Expired";
    const mins = Math.floor(ms / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m left`;
    return `${remMins}m left`;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <p style={{ color: "#9ca3af", marginTop: "16px" }}>
            Loading admin panel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(1.3); } }
        @media (max-width: 639px) {
          .admin-grid { display:flex !important; flex-direction:column !important; gap:16px !important; }
          .admin-header { flex-direction:column !important; gap:12px !important; align-items:flex-start !important; }
          .admin-table-wrap { overflow-x:auto !important; -webkit-overflow-scrolling:touch !important; }
          .admin-table { min-width:600px !important; }
          .admin-btn-group { flex-direction:column !important; }
          .admin-btn-group button { width:100% !important; }
          .time-row { flex-direction:column !important; }
        }
        @media (min-width: 640px) {
          .admin-grid { display:grid !important; grid-template-columns:1fr 1fr !important; gap:20px !important; }
          .admin-card-full { grid-column:1 / -1 !important; }
        }
      `}</style>

      <header style={styles.header} className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={styles.logoBox}>
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
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.subtitle}>{adminUser?.email}</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          style={styles.secondaryBtn}
        >
          Back to Site
        </button>
      </header>

      <div className="admin-grid" style={styles.grid}>
        {/* === STEP 1: FUND USER === */}
        <div className="admin-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.stepBadge}>1</span>
            <h2 style={styles.cardTitle}>Fund User Account</h2>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Select User</label>
            <select
              value={selectedUser?.uid || ""}
              onChange={(e) => {
                const user = users.find((u) => u.uid === e.target.value);
                setSelectedUser(user || null);
                setFundError("");
                setTargetError("");
              }}
              style={styles.select}
            >
              <option value="">Choose a user...</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.email} — {u.username || "No username"} — Balance: $
                  {formatMoney(u.balance)}{" "}
                  {u.hasBeenFunded ? "(Funded)" : "(New)"}
                </option>
              ))}
            </select>
          </div>

          {selectedUser && (
            <div style={styles.userPreview}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "10px",
                }}
              >
                {selectedUser.picture ? (
                  <img
                    src={selectedUser.picture}
                    alt=""
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #0d9488",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#0d9488",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "15px",
                    }}
                  >
                    {(
                      selectedUser.firstName?.[0] || selectedUser.email[0]
                    ).toUpperCase()}
                  </div>
                )}
                <div>
                  <p
                    style={{
                      color: "#fff",
                      fontSize: "15px",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: "12px",
                      margin: "2px 0 0",
                    }}
                  >
                    @{selectedUser.username || "no username"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                  Balance:{" "}
                  <strong style={{ color: "#fff" }}>
                    ${formatMoney(selectedUser.balance)}
                  </strong>
                </span>
                {(() => {
                  const status = getBotStatusDisplay(selectedUser);
                  return (
                    <span
                      style={{
                        color: status.color,
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: status.dotColor,
                          display: "inline-block",
                        }}
                      />
                      {status.text}
                    </span>
                  );
                })()}
              </div>
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Initial Deposit Amount (USD)</label>
            <input
              type="number"
              min="0.01"
              step="any"
              placeholder="e.g. 7000"
              value={fundAmount}
              onChange={(e) => {
                setFundAmount(e.target.value);
                setFundError("");
              }}
              style={styles.input}
            />
            <p
              style={{ color: "#6b7280", fontSize: "12px", margin: "8px 0 0" }}
            >
              Exact amount — no rounding applied.
            </p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>OmniDev Analysing Duration</label>
            <div className="time-row" style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <select
                  value={analysingHours}
                  onChange={(e) => setAnalysingHours(e.target.value)}
                  style={styles.select}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i} hr{i !== 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <select
                  value={analysingMins}
                  onChange={(e) => setAnalysingMins(e.target.value)}
                  style={styles.select}
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>
                      {m} min{m !== 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p
              style={{ color: "#6b7280", fontSize: "12px", margin: "8px 0 0" }}
            >
              How long OmniDev will show "Analysing Market" before trading.
            </p>
          </div>

          {fundError && (
            <div style={{ ...styles.alert, ...styles.alertError }}>
              {fundError}
            </div>
          )}
          {fundSuccess && (
            <div style={{ ...styles.alert, ...styles.alertSuccess }}>
              {fundSuccess}
            </div>
          )}

          <div
            className="admin-btn-group"
            style={{ display: "flex", gap: "10px", marginTop: "8px" }}
          >
            <button
              onClick={handleFundUser}
              disabled={fundLoading || !selectedUser}
              style={{
                ...styles.primaryBtn,
                flex: 1,
                opacity: fundLoading || !selectedUser ? 0.6 : 1,
                cursor:
                  fundLoading || !selectedUser ? "not-allowed" : "pointer",
              }}
            >
              {fundLoading ? (
                <>
                  <span style={styles.spinnerSmall} /> Processing...
                </>
              ) : (
                "Fund Account"
              )}
            </button>
            <button onClick={handleCancelFund} style={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </div>

        {/* === STEP 2: SET TARGET === */}
        <div className="admin-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={{ ...styles.stepBadge, background: "#065f46" }}>
              2
            </span>
            <h2 style={styles.cardTitle}>Set Target & Activate Bot</h2>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Select Funded User</label>
            <select
              value={selectedUser?.uid || ""}
              onChange={(e) => {
                const user = users.find((u) => u.uid === e.target.value);
                setSelectedUser(user || null);
                setTargetError("");
                setFundError("");
              }}
              style={styles.select}
            >
              <option value="">Choose a funded user...</option>
              {users
                .filter((u) => u.hasBeenFunded)
                .map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.email} — Balance: ${formatMoney(u.balance)}{" "}
                    {u.botActive ? "(Active)" : "(Ready)"}
                  </option>
                ))}
            </select>
          </div>

          {selectedUser?.hasBeenFunded && (
            <div style={styles.userPreview}>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "13px",
                  margin: "0 0 6px",
                }}
              >
                Current Balance:{" "}
                <strong style={{ color: "#fff" }}>
                  ${formatMoney(selectedUser.balance)}
                </strong>
              </p>
              <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
                Status:{" "}
                <strong
                  style={{
                    color: selectedUser.botActive ? "#0d9488" : "#ef4444",
                  }}
                >
                  {selectedUser.botActive ? "Bot Active" : "Bot Disabled"}
                </strong>
              </p>
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Target Amount (USD)</label>
            <input
              type="number"
              min="0.01"
              step="any"
              placeholder="e.g. 8000"
              value={targetAmount}
              onChange={(e) => {
                setTargetAmount(e.target.value);
                setTargetError("");
              }}
              style={styles.input}
            />
            <p
              style={{ color: "#6b7280", fontSize: "12px", margin: "8px 0 0" }}
            >
              Balance grows from $
              {formatMoney(selectedUser?.initialBalance || 0)} to this exact
              amount.
            </p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Bot Trading Duration (hours)</label>
            <select
              value={botHours}
              onChange={(e) => setBotHours(e.target.value)}
              style={styles.select}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 12, 24, 48, 72].map((h) => (
                <option key={h} value={h}>
                  {h} hour{h > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedUser?.hasBeenFunded &&
            targetAmount &&
            parseFloat(targetAmount) > selectedUser.initialBalance && (
              <div style={styles.previewBox}>
                <p style={styles.previewTitle}>📈 Growth Preview</p>
                <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
                  ${formatMoney(selectedUser.initialBalance)} → $
                  {formatMoney(parseFloat(targetAmount))} over {botHours}h
                  <br />
                  <span style={{ color: "#6b7280", fontSize: "12px" }}>
                    ~+$
                    {formatMoney(
                      (parseFloat(targetAmount) - selectedUser.initialBalance) /
                        (parseInt(botHours) * 6),
                    )}{" "}
                    every 10 minutes
                  </span>
                </p>
              </div>
            )}

          {targetError && (
            <div style={{ ...styles.alert, ...styles.alertError }}>
              {targetError}
            </div>
          )}
          {targetSuccess && (
            <div style={{ ...styles.alert, ...styles.alertSuccess }}>
              {targetSuccess}
            </div>
          )}

          <div
            className="admin-btn-group"
            style={{ display: "flex", gap: "10px", marginTop: "8px" }}
          >
            <button
              onClick={handleSetTarget}
              disabled={targetLoading || !selectedUser?.hasBeenFunded}
              style={{
                ...styles.primaryBtn,
                flex: 1,
                opacity:
                  targetLoading || !selectedUser?.hasBeenFunded ? 0.6 : 1,
                cursor:
                  targetLoading || !selectedUser?.hasBeenFunded
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {targetLoading ? (
                <>
                  <span style={styles.spinnerSmall} /> Processing...
                </>
              ) : (
                "Set Target & Activate Bot"
              )}
            </button>
            <button onClick={handleCancelTarget} style={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </div>

        {/* === ALL USERS TABLE === */}
        <div
          className="admin-card admin-card-full"
          style={{ ...styles.card, gridColumn: "1 / -1" }}
        >
          <h2 style={{ ...styles.cardTitle, marginBottom: "16px" }}>
            👥 All Users ({users.length})
          </h2>
          <div
            className="admin-table-wrap"
            style={{
              overflowX: "auto",
              borderRadius: "12px",
              border: "1px solid #222",
            }}
          >
            <table
              className="admin-table"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "640px",
              }}
            >
              <thead>
                <tr style={{ background: "#0d9488" }}>
                  {["User", "Balance", "Target", "Status", "Time Left"].map(
                    (h) => (
                      <th key={h} style={{ ...styles.th, color: "#fff" }}>
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
                    const status = getBotStatusDisplay(u);
                    return (
                      <tr
                        key={u.uid}
                        onClick={() => {
                          setSelectedUser(u);
                          setFundError("");
                          setTargetError("");
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
                        <td style={{ padding: "14px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: u.picture
                                  ? "transparent"
                                  : "#0d9488",
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
                            <div>
                              <p
                                style={{
                                  color: "#fff",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  margin: 0,
                                }}
                              >
                                {u.email}
                              </p>
                              <p
                                style={{
                                  color: "#6b7280",
                                  fontSize: "11px",
                                  margin: "2px 0 0",
                                }}
                              >
                                @{u.username || "no username"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              color: "#fff",
                              fontSize: "14px",
                              fontWeight: 700,
                            }}
                          >
                            ${formatMoney(u.balance)}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              color: u.targetAmount > 0 ? "#0d9488" : "#6b7280",
                              fontSize: "14px",
                              fontWeight: 700,
                            }}
                          >
                            {u.targetAmount > 0
                              ? `$${formatMoney(u.targetAmount)}`
                              : "—"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              color: status.color,
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: status.dotColor,
                                display: "inline-block",
                              }}
                            />
                            {status.text}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ color: "#6b7280", fontSize: "12px" }}>
                            {u.botExpiresAt
                              ? formatTimeLeft(u.botExpiresAt)
                              : u.analysingExpiresAt
                                ? formatTimeLeft(u.analysingExpiresAt)
                                : "—"}
                          </span>
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

      {/* === TRANSACTIONS TABLE === */}
      <div style={{ ...styles.card, marginTop: "24px" }}>
        <h2 style={{ ...styles.cardTitle, marginBottom: "16px" }}>
          📊 Recent Funding Transactions
        </h2>
        {transactions.length === 0 ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>
            No transactions yet.
          </p>
        ) : (
          <div
            className="admin-table-wrap"
            style={{
              overflowX: "auto",
              borderRadius: "12px",
              border: "1px solid #222",
            }}
          >
            <table
              className="admin-table"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "700px",
              }}
            >
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
                    <th key={h} style={{ ...styles.th, color: "#fff" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const liveStatus = getTransactionStatusDisplay(t);
                  const statusColor =
                    liveStatus === "completed"
                      ? "#0d9488"
                      : liveStatus === "trading"
                        ? "#f59e0b"
                        : liveStatus === "analysing"
                          ? "#3b82f6"
                          : "#0d9488";
                  const statusBg =
                    liveStatus === "completed"
                      ? "rgba(13,148,136,0.15)"
                      : liveStatus === "trading"
                        ? "rgba(245,158,11,0.15)"
                        : liveStatus === "analysing"
                          ? "rgba(59,130,246,0.15)"
                          : "rgba(13,148,136,0.15)";

                  return (
                    <tr
                      key={t.id}
                      style={{ borderBottom: "1px solid #1a1a1a" }}
                    >
                      <td style={{ padding: "14px 16px" }}>
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
                            margin: "2px 0 0",
                          }}
                        >
                          {t.userEmail}
                        </p>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            background: "rgba(13,148,136,0.15)",
                            color: "#0d9488",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {t.type === "initial_fund" ? "Fund" : "Target"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            color: "#0d9488",
                            fontWeight: 700,
                            fontSize: "14px",
                          }}
                        >
                          +${formatMoney(t.amount || t.initialAmount || 0)}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            color: "#0d9488",
                            fontWeight: 700,
                            fontSize: "14px",
                          }}
                        >
                          {t.targetAmount
                            ? `$${formatMoney(t.targetAmount)}`
                            : "—"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ color: "#0d9488", fontSize: "13px" }}>
                          {t.botHours ? `${t.botHours}h` : "—"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            background: statusBg,
                            color: statusColor,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {liveStatus}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                          {t.timestamp.toLocaleString()}
                        </span>
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

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#fff",
    padding: "16px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: "border-box",
    width: "100%",
    maxWidth: "100vw",
    overflowX: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #1a1a1a",
    flexWrap: "wrap",
    gap: "12px",
  },
  logoBox: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#0d9488",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: "22px", fontWeight: 800, margin: 0 },
  subtitle: { color: "#6b7280", fontSize: "13px", margin: "2px 0 0" },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    width: "100%",
    maxWidth: "100%",
  },
  card: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "16px",
    padding: "20px",
    width: "100%",
    boxSizing: "border-box",
    minWidth: 0,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  stepBadge: {
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
  },
  cardTitle: { color: "#fff", fontSize: "17px", fontWeight: 700, margin: 0 },
  formGroup: { marginBottom: "18px" },
  label: {
    display: "block",
    color: "#9ca3af",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "8px",
  },
  select: {
    width: "100%",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' strokeWidth='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "36px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
  },
  primaryBtn: {
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
    gap: "10px",
  },
  cancelBtn: {
    padding: "14px 20px",
    background: "transparent",
    border: "1px solid #333",
    borderRadius: "10px",
    color: "#9ca3af",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "10px 20px",
    background: "transparent",
    border: "1px solid #333",
    borderRadius: "10px",
    color: "#9ca3af",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  alert: {
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    marginBottom: "16px",
    border: "1px solid",
  },
  alertError: {
    background: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.25)",
    color: "#f87171",
  },
  alertSuccess: {
    background: "rgba(13,148,136,0.08)",
    borderColor: "rgba(13,148,136,0.25)",
    color: "#0d9488",
  },
  loadingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #1a1a1a",
    borderTop: "3px solid #0d9488",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  spinnerSmall: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  userPreview: {
    background: "#1a1a1a",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "18px",
    border: "1px solid #2a2a2a",
  },
  previewBox: {
    background: "rgba(13,148,136,0.06)",
    border: "1px solid rgba(13,148,136,0.2)",
    borderRadius: "10px",
    padding: "14px 16px",
    marginBottom: "16px",
  },
  previewTitle: {
    color: "#0d9488",
    fontSize: "13px",
    fontWeight: 700,
    margin: "0 0 8px",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
};
