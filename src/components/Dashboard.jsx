import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "/src/images/omnidev logo.png";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ConnectWallet } from "./ConnectWallet";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { TickerBar } from "./TickerBar";

const ADMIN_EMAIL = "fiyinolaleke@gmail.com";

const formatMoney = (val) => {
  if (val === undefined || val === null) return "0.00";
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return "0.00";
  const rounded = Math.round(num * 100) / 100;
  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const SIDEBAR_ITEMS = [
  {
    label: "Dashboard",
    path: "dashboard",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Deposit USD",
    path: "deposit",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    label: "Withdraw USD",
    path: "withdraw",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "Transactions",
    path: "transactions",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    label: "Profile",
    path: "profile",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [logoutMsg, setLogoutMsg] = useState(false);
  const navigate = useNavigate();
  const [walletOpen, setWalletOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const fileInputRef = useRef(null);
  const contentScrollRef = useRef(null);

  const [profileLoading, setProfileLoading] = useState(true);
  const [botPhase, setBotPhase] = useState("disabled");
  const [userTransactions, setUserTransactions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [balance, setBalance] = useState(0);

  const [withdrawStep, setWithdrawStep] = useState("form");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawWallet, setWithdrawWallet] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  const [vsnRequired, setVsnRequired] = useState(false);
  const [showVsnModal, setShowVsnModal] = useState(false);
  const [vsnInput, setVsnInput] = useState("");
  const [vsnError, setVsnError] = useState("");
  const [vsnSuccess, setVsnSuccess] = useState(false);
  const [vsnLoading, setVsnLoading] = useState(false);

  const [hasWithdrawnBefore, setHasWithdrawnBefore] = useState(false);

  const [reversalActive, setReversalActive] = useState(false);
  const [reversalAmount, setReversalAmount] = useState(0);
  const [showReversalModal, setShowReversalModal] = useState(false);
  const [reversalLoading, setReversalLoading] = useState(false);
  const [reversalError, setReversalError] = useState("");

  const [txnSearch, setTxnSearch] = useState("");
  const [txnFilter, setTxnFilter] = useState("All Types");

  /* --- Auth + profile load --- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }
      setIsAdmin(user.email === ADMIN_EMAIL);
      window.history.replaceState(null, "", "/dashboard");
      await user.reload();
      const freshUser = auth.currentUser;
      const s = { email: freshUser.email, uid: freshUser.uid };
      setSession(s);
      const timeout = setTimeout(() => setProfileLoading(false), 5000);
      try {
        const userDoc = await getDoc(doc(db, "users", freshUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const profileDoc = await getDoc(doc(db, "profiles", freshUser.uid));
        const profileData = profileDoc.exists() ? profileDoc.data() : {};
        setProfileForm({
          firstName:
            userData.firstName || freshUser.displayName?.split(" ")[0] || "",
          lastName:
            userData.lastName || freshUser.displayName?.split(" ")[1] || "",
          username:
            profileData.username ||
            userData.username ||
            freshUser.email.split("@")[0],
          email: userData.email || freshUser.email,
        });
        setProfilePic(profileData.picture || null);
        setHasWithdrawnBefore(
          (userData.withdrawalCompletedCount || 0) > 0 ||
            userData.withdrawalStatus === "successful" ||
            userData.vsn_verified === true,
        );
        clearTimeout(timeout);
      } catch (err) {
        console.error("Profile load error:", err);
        setProfileForm({
          firstName: freshUser.displayName?.split(" ")[0] || "",
          lastName: freshUser.displayName?.split(" ")[1] || "",
          username: freshUser.email.split("@")[0],
          email: freshUser.email,
        });
        clearTimeout(timeout);
      } finally {
        setProfileLoading(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  /* --- Real-time balance + bot phase --- */
  useEffect(() => {
    if (!session?.uid) return;
    const userRef = doc(db, "users", session.uid);
    const computePhase = (data) => {
      const now = Date.now();
      if (!data.hasBeenFunded) return "disabled";
      const botExpMs = data.botExpiresAt?.toMillis?.() || data.botExpiresAt;
      if (botExpMs && now >= botExpMs) return "disabled";
      if (botExpMs && now < botExpMs) return "activated";
      return "analysing";
    };
    const unsub = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setBalance(data.balance || 0);
      setBotPhase(computePhase(data));
      const nowVsnRequired = data.vsn_required === true && !data.vsn_verified;
      setVsnRequired(nowVsnRequired);
      const nowHasWithdrawn =
        (data.withdrawalCompletedCount || 0) > 0 ||
        data.withdrawalStatus === "successful" ||
        data.vsn_verified === true;
      setHasWithdrawnBefore(nowHasWithdrawn);
      setReversalActive(data.reversalActive === true);
      setReversalAmount(data.reversalAmount || 0);
      setWithdrawStep((prev) => {
        if (prev === "contact_support" && nowVsnRequired) return "vsn_pending";
        if (
          data.withdrawalStatus === "successful" &&
          prev !== "reversal" &&
          data.reversalActive
        ) {
          return "reversal";
        }
        return prev;
      });
    });
    return () => unsub();
  }, [session?.uid]);

  /* --- Real-time transactions --- */
  useEffect(() => {
    if (!session?.uid) return;
    const txnRef = collection(db, "users", session.uid, "transactions");
    const unsub = onSnapshot(query(txnRef), (snap) => {
      const txns = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate?.() || new Date(),
      }));
      txns.sort((a, b) => b.timestamp - a.timestamp);
      setUserTransactions(txns);
    });
    return () => unsub();
  }, [session?.uid]);

  useEffect(() => {
    const id = setInterval(
      () => setUserTransactions((prev) => [...prev]),
      30_000,
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (activeTab === "withdraw") {
      setWithdrawSuccess("");
      setWithdrawError("");
    }
  }, [activeTab]);

  const getLiveStatus = (t) => {
    if (t.status === "processing") {
      const failsAtMs =
        t.failsAt?.toMillis?.() ||
        t.failsAt ||
        (t.timestamp instanceof Date
          ? t.timestamp.getTime() + 10 * 60 * 1000
          : null);
      if (failsAtMs && Date.now() >= failsAtMs) return "failed";
    }
    return t.status;
  };

  /* --- Sidebar scroll lock --- */
  useEffect(() => {
    const scrollEl = contentScrollRef.current;
    if (sidebarOpen) {
      const scrollY = scrollEl ? scrollEl.scrollTop : 0;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = "100%";
      if (scrollEl) {
        scrollEl.style.overflow = "hidden";
        scrollEl.dataset.savedScroll = scrollY;
      }
    } else {
      const savedTop = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (savedTop) window.scrollTo(0, parseInt(savedTop || "0") * -1);
      if (scrollEl) {
        scrollEl.style.overflow = "auto";
        const saved = parseInt(scrollEl.dataset.savedScroll || "0");
        scrollEl.scrollTop = saved;
        delete scrollEl.dataset.savedScroll;
      }
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollEl) scrollEl.style.overflow = "auto";
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    setLogoutMsg(true);
    setTimeout(async () => {
      await signOut(auth);
      localStorage.removeItem("omnidev_session");
      navigate("/");
    }, 1800);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileError("Image must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const pic = ev.target.result;
      setProfilePic(pic);
      setProfileError("");
      try {
        const currentUsername =
          profileForm.username?.toLowerCase().trim() ||
          session.email.split("@")[0];
        await setDoc(
          doc(db, "profiles", session.uid),
          { picture: pic, username: currentUsername, updatedAt: new Date() },
          { merge: true },
        );
        await setDoc(
          doc(db, "users", session.uid),
          { picture: pic, updatedAt: new Date() },
          { merge: true },
        );
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2500);
      } catch (err) {
        console.error("Image save error:", err);
        setProfileError("Failed to save image. Please try again.");
      }
    };
    reader.onerror = () => setProfileError("Failed to read image file.");
    reader.readAsDataURL(file);
  };

  const isUsernameTakenByOther = async (username) => {
    const norm = username.toLowerCase().trim();
    const pq = query(collection(db, "profiles"), where("username", "==", norm));
    const ps = await getDocs(pq);
    if (!ps.empty && ps.docs[0].id !== session.uid) return true;
    const uq = query(collection(db, "users"), where("username", "==", norm));
    const us = await getDocs(uq);
    if (!us.empty && us.docs[0].id !== session.uid) return true;
    return false;
  };

  const handleProfileSave = async () => {
    if (!session) return;
    setProfileError("");
    setProfileSaved(false);
    setSavingProfile(true);
    const newUsername = profileForm.username.toLowerCase().trim();
    if (newUsername.length < 3) {
      setProfileError("Username must be at least 3 characters.");
      setSavingProfile(false);
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setProfileError(
        "Username can only contain letters, numbers, and underscores.",
      );
      setSavingProfile(false);
      return;
    }
    try {
      const taken = await isUsernameTakenByOther(newUsername);
      if (taken) {
        setProfileError("Username already taken by another user.");
        setSavingProfile(false);
        return;
      }
      await setDoc(
        doc(db, "profiles", session.uid),
        {
          username: newUsername,
          picture: profilePic,
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          email: profileForm.email,
          updatedAt: new Date(),
        },
        { merge: true },
      );
      await setDoc(
        doc(db, "users", session.uid),
        {
          username: newUsername,
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
        },
        { merge: true },
      );
      setProfileForm((prev) => ({ ...prev, username: newUsername }));
      setSavingProfile(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      console.error("Save error:", err);
      setProfileError("Failed to save. Check your connection and try again.");
      setSavingProfile(false);
    }
  };

  /* --- WITHDRAW: Main click handler --- */
  const handleWithdrawClick = async () => {
    setWithdrawError("");
    if (botPhase === "activated" || botPhase === "analysing") return;
    const amt = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amt) || amt <= 0) {
      setWithdrawError("Please enter a valid withdrawal amount.");
      return;
    }
    if (!withdrawWallet || withdrawWallet.trim().length < 5) {
      setWithdrawError("Please enter your preferred wallet/payment details.");
      return;
    }
    if (amt > balance) {
      setWithdrawError("Withdrawal amount exceeds your available balance.");
      return;
    }
    try {
      const userRef = doc(db, "users", session.uid);
      if (!hasWithdrawnBefore) {
        await updateDoc(userRef, {
          pendingWithdrawAmount: amt,
          pendingWithdrawWallet: withdrawWallet.trim(),
          pendingWithdrawAt: Timestamp.now(),
          withdrawalStatus: "pending_support",
          vsn_required: false,
          vsn_verified: false,
          vsn_code: "",
        });
        setWithdrawStep("contact_support");
      } else {
        await updateDoc(userRef, {
          pendingWithdrawAmount: amt,
          pendingWithdrawWallet: withdrawWallet.trim(),
          pendingWithdrawAt: Timestamp.now(),
          withdrawalStatus: "processing",
        });
        await setDoc(
          doc(collection(db, "users", session.uid, "transactions")),
          {
            type: "withdrawal",
            amount: amt,
            status: "processing",
            failsAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
            timestamp: Timestamp.now(),
            description: `Withdrawal request -- $${formatMoney(amt)}`,
          },
        );
        setWithdrawStep("processing");
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      setWithdrawError("Unable to process withdrawal. Please try again.");
    }
  };

  /* --- VSN submit (first withdrawal only) --- */
  const handleVsnSubmit = async () => {
    if (!vsnInput.trim()) {
      setVsnError("Please enter your VSN code.");
      return;
    }
    setVsnLoading(true);
    setVsnError("");
    try {
      const userRef = doc(db, "users", session.uid);
      const snap = await getDoc(userRef);
      const data = snap.data();
      if (data.vsn_code && vsnInput.trim() !== data.vsn_code) {
        setVsnError("Incorrect VSN code. Please contact support.");
        setVsnLoading(false);
        return;
      }
      await updateDoc(userRef, {
        vsn_required: false,
        vsn_verified: true,
        vsn_verified_at: Timestamp.now(),
        withdrawalStatus: "processing",
      });
      await setDoc(doc(collection(db, "users", session.uid, "transactions")), {
        type: "withdrawal",
        amount: data.pendingWithdrawAmount || 0,
        status: "processing",
        failsAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
        timestamp: Timestamp.now(),
        description: `Withdrawal request verified via VSN`,
      });
      setVsnInput("");
      setVsnError("");
      setWithdrawStep("processing");
    } catch (e) {
      console.error(e);
      setVsnError("Verification failed. Try again.");
    } finally {
      setVsnLoading(false);
    }
  };

  /* --- HANDLE REVERSAL --- */
  const handleReversal = async () => {
    if (!reversalActive || reversalAmount <= 0) return;
    setReversalLoading(true);
    setReversalError("");
    try {
      const userRef = doc(db, "users", session.uid);
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User not found");
        const currentBalance = userDoc.data().balance || 0;
        const newBalance = currentBalance + reversalAmount;
        transaction.update(userRef, {
          balance: newBalance,
          reversalActive: false,
          reversalAmount: 0,
          reversalCompletedAt: Timestamp.now(),
          withdrawalStatus: "reversed",
        });
        const txnRef = doc(
          collection(db, "users", session.uid, "transactions"),
        );
        transaction.set(txnRef, {
          type: "reversal",
          amount: reversalAmount,
          status: "completed",
          timestamp: Timestamp.now(),
          description: `Reversal of $${formatMoney(reversalAmount)} -- funds returned to balance`,
        });
      });
      setShowReversalModal(false);
      setWithdrawStep("form");
      setWithdrawAmount("");
      setWithdrawWallet("");
    } catch (err) {
      console.error("Reversal error:", err);
      setReversalError("Reversal failed. Please try again.");
    } finally {
      setReversalLoading(false);
    }
  };

  const handleExportTransactions = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ["VSN", "Type", "Status", "Amount", "Date", "Description"];
    const rows = filteredTransactions.map((t) => {
      let typeName = t.type || "";
      if (typeName === "solana") typeName = "Solana";
      else if (typeName === "deposit") typeName = "Deposit";
      else if (typeName === "growth" || typeName === "bot_profit")
        typeName = "Solana";
      else if (typeName === "wallet_failed")
        typeName = "Wallet Connection Failed";
      else if (typeName === "vsn") typeName = "VSN Deposit";
      else if (typeName === "reversal") typeName = "Reversal";
      else typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
      return [
        t.id.slice(-6).toUpperCase(),
        typeName,
        t.status || "",
        (t.type === "deposit" ||
        t.type === "solana" ||
        t.type === "growth" ||
        t.type === "bot_profit" ||
        t.type === "vsn" ||
        t.type === "reversal"
          ? "+"
          : t.type === "wallet_failed"
            ? ""
            : "-") +
          "$" +
          formatMoney(t.amount),
        t.timestamp ? t.timestamp.toLocaleString() : "",
        t.description || "",
      ];
    });
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute(
      "download",
      `omnidev_transactions_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = userTransactions.filter((t) => {
    const typeLabel = (() => {
      if (t.type === "deposit") return "deposit";
      if (t.type === "solana" || t.type === "growth" || t.type === "bot_profit")
        return "solana";
      if (t.type === "withdrawal") return "withdrawal";
      if (t.type === "wallet_failed") return "wallet_failed";
      if (t.type === "vsn") return "vsn";
      if (t.type === "reversal") return "reversal";
      return t.type || "";
    })();
    const matchesFilter =
      txnFilter === "All Types" ||
      (txnFilter === "Deposit" && typeLabel === "deposit") ||
      (txnFilter === "Withdrawal" && typeLabel === "withdrawal") ||
      (txnFilter === "Solana" && typeLabel === "solana") ||
      (txnFilter === "Reversal" && typeLabel === "reversal") ||
      (txnFilter === "VSN" && typeLabel === "vsn");
    const searchLower = txnSearch.toLowerCase();
    const matchesSearch =
      !searchLower ||
      t.id.toLowerCase().includes(searchLower) ||
      typeLabel.includes(searchLower) ||
      (t.status || "").toLowerCase().includes(searchLower) ||
      (t.description || "").toLowerCase().includes(searchLower) ||
      String(t.amount || "").includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  if (!session) return null;
  const displayName =
    profileForm.username || session?.email?.split("@")[0] || "";

  const getBotDisplay = () => {
    switch (botPhase) {
      case "activated":
        return {
          text: "Bot Trading Activated",
          subText: "OmniDev is actively analysing the market",
          dotColor: "#22c55e",
          bgColor: "rgba(34,197,94,0.1)",
          borderColor: "rgba(34,197,94,0.3)",
          textColor: "#22c55e",
        };
      case "analysing":
        return {
          text: "OmniDev Analysing Market",
          subText: "Please wait while OmniDev analyzes the market conditions",
          dotColor: "#0d9488",
          bgColor: "rgba(13,148,136,0.1)",
          borderColor: "rgba(13,148,136,0.3)",
          textColor: "#0d9488",
        };
      default:
        return {
          text: "Bot Trading Disabled",
          subText: "Fund your account to activate",
          dotColor: "#ef4444",
          bgColor: "rgba(239,68,68,0.08)",
          borderColor: "rgba(239,68,68,0.25)",
          textColor: "#ef4444",
        };
    }
  };
  const botDisplay = getBotDisplay();

  const getStatusBadgeStyle = (status, type) => {
    if (type === "wallet_failed" || status === "failed")
      return { background: "rgba(239,68,68,0.15)", color: "#ef4444" };
    if (status === "completed" || status === "processing")
      return { background: "rgba(13,148,136,0.15)", color: "#0d9488" };
    if (status === "successful")
      return { background: "rgba(34,197,94,0.15)", color: "#22c55e" };
    if (status === "reversed")
      return { background: "rgba(245,158,11,0.15)", color: "#fbbf24" };
    return { background: "rgba(13,148,136,0.15)", color: "#0d9488" };
  };

  const getTypeLabel = (type) => {
    if (type === "deposit") return "Deposit";
    if (type === "solana" || type === "growth" || type === "bot_profit")
      return "Solana";
    if (type === "withdrawal") return "Withdrawal";
    if (type === "wallet_failed") return "Wallet Connection";
    if (type === "vsn") return "VSN Deposit";
    if (type === "reversal") return "Reversal";
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : "--";
  };

  const getAmountColor = (type) =>
    type === "deposit" ||
    type === "solana" ||
    type === "growth" ||
    type === "bot_profit" ||
    type === "vsn" ||
    type === "reversal"
      ? "#22c55e"
      : "#ef4444";
  const getAmountPrefix = (type) =>
    type === "deposit" ||
    type === "solana" ||
    type === "growth" ||
    type === "bot_profit" ||
    type === "vsn" ||
    type === "reversal"
      ? "+"
      : type === "wallet_failed"
        ? ""
        : "-";

  /* == HOURGLASS (bot trading lock) -- TEAL THEME == */
  const HourglassLocked = () => (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <style>{`
        @keyframes hg-rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes hg-sand-top { 0% { transform: scaleY(1); } 45% { transform: scaleY(0); } 50% { transform: scaleY(0); } 55% { transform: scaleY(1); } 100% { transform: scaleY(1); } }
        @keyframes hg-sand-bot { 0% { transform: scaleY(0); } 45% { transform: scaleY(1); } 50% { transform: scaleY(1); } 55% { transform: scaleY(0); } 100% { transform: scaleY(0); } }
        @keyframes hg-glow { 0%, 100% { filter: drop-shadow(0 0 15px rgba(13,148,136,0.6)) drop-shadow(0 0 40px rgba(13,148,136,0.4)); } 50% { filter: drop-shadow(0 0 25px rgba(13,148,136,0.8)) drop-shadow(0 0 60px rgba(13,148,136,0.5)); } }
        @keyframes hg-drip { 0%, 40% { opacity: 1; transform: translateY(0); } 45% { opacity: 0.5; transform: translateY(6px); } 50%, 100% { opacity: 0; transform: translateY(0); } }
        @keyframes hg-pulse-ring { 0% { transform: scale(0.8); opacity: 0.6; } 50% { transform: scale(1.2); opacity: 0; } 100% { transform: scale(0.8); opacity: 0.6; } }
        @keyframes hg-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .hg-container { animation: hg-float 3s ease-in-out infinite; }
        .hg-wrap { animation: hg-rotate 4s linear infinite, hg-glow 2s ease-in-out infinite; display: inline-block; transform-origin: center center; }
        .hg-sand-top { transform-origin: bottom; animation: hg-sand-top 3s ease-in-out infinite; }
        .hg-sand-bot { transform-origin: top; animation: hg-sand-bot 3s ease-in-out infinite; }
        .hg-drip { animation: hg-drip 3s ease-in-out infinite; }
        .hg-pulse-ring { animation: hg-pulse-ring 2s ease-in-out infinite; transform-origin: center; }
      `}</style>
      <div
        className="hg-container"
        style={{
          marginBottom: "28px",
          position: "relative",
          display: "inline-block",
        }}
      >
        <div
          className="hg-pulse-ring"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100px",
            height: "100px",
            marginLeft: "-50px",
            marginTop: "-50px",
            borderRadius: "50%",
            border: "2px solid rgba(13,148,136,0.3)",
            background:
              "radial-gradient(circle, rgba(13,148,136,0.1) 0%, transparent 70%)",
          }}
        />
        <div className="hg-wrap">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <path
              d="M20 10 L60 10 L60 14 L48 34 L48 46 L60 66 L60 70 L20 70 L20 66 L32 46 L32 34 L20 14 Z"
              stroke="#0d9488"
              strokeWidth="2.5"
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.9"
            />
            <rect
              x="18"
              y="8"
              width="44"
              height="4"
              rx="2"
              fill="rgba(13,148,136,0.3)"
              stroke="#0d9488"
              strokeWidth="1.5"
            />
            <rect
              x="18"
              y="68"
              width="44"
              height="4"
              rx="2"
              fill="rgba(13,148,136,0.3)"
              stroke="#0d9488"
              strokeWidth="1.5"
            />
            <clipPath id="top-clip">
              <path d="M22 14 L58 14 L47 33 L33 33 Z" />
            </clipPath>
            <g clipPath="url(#top-clip)">
              <rect
                className="hg-sand-top"
                x="22"
                y="14"
                width="36"
                height="20"
                fill="rgba(13,148,136,0.6)"
              />
            </g>
            <clipPath id="bot-clip">
              <path d="M33 47 L47 47 L58 66 L22 66 Z" />
            </clipPath>
            <g clipPath="url(#bot-clip)">
              <rect
                className="hg-sand-bot"
                x="22"
                y="47"
                width="36"
                height="20"
                fill="rgba(13,148,136,0.6)"
              />
            </g>
            <line
              x1="40"
              y1="33"
              x2="40"
              y2="47"
              stroke="rgba(13,148,136,0.7)"
              strokeWidth="2"
              strokeDasharray="3 3"
              className="hg-drip"
            />
            <circle cx="40" cy="40" r="3" fill="#0d9488" opacity="0.9">
              <animate
                attributeName="r"
                values="2;4;2"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.9;0.4;0.9"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>
      </div>
      <p
        style={{
          color: "#fff",
          fontSize: "18px",
          fontWeight: 700,
          margin: "0 0 10px",
        }}
      >
        Withdrawals Locked
      </p>
      <p
        style={{
          color: "#9ca3af",
          fontSize: "14px",
          lineHeight: 1.65,
          maxWidth: "280px",
          margin: "0 auto",
        }}
      >
        Withdrawals will be enabled once the bot has completed trading.
      </p>
    </div>
  );

  /* == CONTACT SUPPORT SCREEN -- PURPLE THEME -- INLINE VSN INPUT == */
  const ContactSupportScreen = () => (
    <div
      style={{
        position: "relative",
        textAlign: "center",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(124,92,252,0.28) 1px,transparent 1px),linear-gradient(90deg,rgba(124,92,252,0.28) 1px,transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage:
            "radial-gradient(ellipse 75% 75% at 50% 50%,transparent 35%,black 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 75% at 50% 50%,transparent 35%,black 70%)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <style>{`
          @keyframes support-pulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(124,92,252,0.3); } 50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(124,92,252,0.5); } }
          @keyframes support-glow { 0%, 100% { filter: drop-shadow(0 0 10px rgba(124,92,252,0.4)); } 50% { filter: drop-shadow(0 0 25px rgba(124,92,252,0.7)); } }
          .support-icon-wrap { animation: support-pulse 2s ease-in-out infinite, support-glow 2s ease-in-out infinite; }
        `}</style>
        <div
          className="support-icon-wrap"
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7C5CFC, #5b3fd4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1" fill="white" />
          </svg>
        </div>
        <p
          style={{
            color: "#a78bfa",
            fontSize: "22px",
            fontWeight: 800,
            margin: "0 0 12px",
          }}
        >
          Contact Support for VSN Code
        </p>
        <p
          style={{
            color: "#9ca3af",
            fontSize: "14px",
            lineHeight: 1.65,
            maxWidth: "320px",
            margin: "0 auto 24px",
          }}
        >
          Your first withdrawal requires verification. Please contact our
          support team to request your VSN code. Once you receive it, enter it
          below.
        </p>
        <div
          style={{
            background: "rgba(124,92,252,0.08)",
            border: "1px solid rgba(124,92,252,0.2)",
            borderRadius: "14px",
            padding: "20px",
            maxWidth: "320px",
            margin: "0 auto 20px",
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <span style={{ color: "#6b7280", fontSize: "13px" }}>Amount</span>
            <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>
              ${formatMoney(withdrawAmount)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <span style={{ color: "#6b7280", fontSize: "13px" }}>Wallet</span>
            <span
              style={{
                color: "#fff",
                fontSize: "13px",
                fontWeight: 500,
                maxWidth: "150px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {withdrawWallet}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#6b7280", fontSize: "13px" }}>Status</span>
            <span
              style={{ color: "#a78bfa", fontSize: "13px", fontWeight: 700 }}
            >
              Awaiting VSN
            </span>
          </div>
        </div>
        <div style={{ maxWidth: "320px", margin: "0 auto 16px" }}>
          <input
            type="text"
            placeholder="Enter your VSN code"
            value={vsnInput}
            onChange={(e) => {
              setVsnInput(e.target.value);
              setVsnError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleVsnSubmit()}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#1a1a2e",
              border: vsnError
                ? "1.5px solid #ef4444"
                : "1.5px solid rgba(124,92,252,0.3)",
              borderRadius: "12px",
              padding: "15px 16px",
              color: "#fff",
              fontSize: "18px",
              outline: "none",
              textAlign: "center",
              letterSpacing: "0.2em",
              fontWeight: 700,
              transition: "border-color 0.2s",
              marginBottom: "10px",
            }}
          />
          {vsnError && (
            <p
              style={{
                color: "#f87171",
                fontSize: "13px",
                margin: "0 0 10px",
                fontWeight: 500,
              }}
            >
              {vsnError}
            </p>
          )}
          <button
            onClick={handleVsnSubmit}
            disabled={vsnLoading}
            style={{
              width: "100%",
              padding: "14px",
              background: vsnLoading
                ? "rgba(124,92,252,0.5)"
                : "linear-gradient(135deg,#7C5CFC,#5b3fd4)",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontWeight: 700,
              fontSize: "16px",
              cursor: vsnLoading ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: vsnLoading
                ? "none"
                : "0 4px 16px rgba(124,92,252,0.35)",
              transition: "all 0.2s",
            }}
          >
            {vsnLoading ? (
              <>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2.5px solid rgba(255,255,255,0.3)",
                    borderTop: "2.5px solid #fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Verifying...
              </>
            ) : (
              "Proceed"
            )}
          </button>
        </div>
        <button
          onClick={() => {
            setWithdrawStep("form");
            setWithdrawAmount("");
            setWithdrawWallet("");
            setVsnInput("");
            setVsnError("");
          }}
          style={{
            padding: "10px 20px",
            background: "transparent",
            border: "1px solid #333",
            borderRadius: "10px",
            color: "#9ca3af",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#7C5CFC";
            e.currentTarget.style.color = "#a78bfa";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#333";
            e.currentTarget.style.color = "#9ca3af";
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  /* == VSN PENDING SCREEN -- PURPLE THEME -- INLINE VSN INPUT == */
  const VsnPendingScreen = () => (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #7C5CFC, #5b3fd4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "0 8px 24px rgba(124,92,252,0.4)",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          <circle cx="12" cy="16" r="1" fill="white" />
        </svg>
      </div>
      <p
        style={{
          color: "#a78bfa",
          fontSize: "22px",
          fontWeight: 800,
          margin: "0 0 12px",
        }}
      >
        VSN Code Ready
      </p>
      <p
        style={{
          color: "#9ca3af",
          fontSize: "14px",
          lineHeight: 1.65,
          maxWidth: "320px",
          margin: "0 auto 24px",
        }}
      >
        Your VSN code has been issued. Kindly check your email for the code,
        then enter it below.
      </p>
      <div style={{ maxWidth: "320px", margin: "0 auto 16px" }}>
        <input
          type="text"
          placeholder="Enter your VSN code"
          value={vsnInput}
          onChange={(e) => {
            setVsnInput(e.target.value);
            setVsnError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleVsnSubmit()}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "#1a1a2e",
            border: vsnError
              ? "1.5px solid #ef4444"
              : "1.5px solid rgba(124,92,252,0.3)",
            borderRadius: "12px",
            padding: "15px 16px",
            color: "#fff",
            fontSize: "18px",
            outline: "none",
            textAlign: "center",
            letterSpacing: "0.2em",
            fontWeight: 700,
            transition: "border-color 0.2s",
            marginBottom: "10px",
          }}
        />
        {vsnError && (
          <p
            style={{
              color: "#f87171",
              fontSize: "13px",
              margin: "0 0 10px",
              fontWeight: 500,
            }}
          >
            {vsnError}
          </p>
        )}
        <button
          onClick={handleVsnSubmit}
          disabled={vsnLoading}
          style={{
            width: "100%",
            padding: "14px",
            background: vsnLoading
              ? "rgba(124,92,252,0.5)"
              : "linear-gradient(135deg,#7C5CFC,#5b3fd4)",
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            fontWeight: 700,
            fontSize: "16px",
            cursor: vsnLoading ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: vsnLoading ? "none" : "0 4px 16px rgba(124,92,252,0.35)",
            transition: "all 0.2s",
          }}
        >
          {vsnLoading ? (
            <>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2.5px solid rgba(255,255,255,0.3)",
                  borderTop: "2.5px solid #fff",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
              Verifying...
            </>
          ) : (
            "Proceed"
          )}
        </button>
      </div>
    </div>
  );

  /* == WITHDRAWAL PROCESSING SCREEN -- "VSN Verified -- Queued" == */
  const WithdrawalProcessingScreen = () => (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <p
        style={{
          color: "#fff",
          fontSize: "35px",
          fontWeight: 800,
          margin: "0 0 12px",
        }}
      >
        Withdraw USD
      </p>
      <p
        style={{
          color: "#9ca3af",
          fontSize: "18px",
          margin: "0 0 32px",
          lineHeight: 1.5,
        }}
      >
        Withdraw your USD into your bank account or preferred payment method
      </p>
      <div
        style={{
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.25)",
          borderRadius: "18px",
          padding: "40px 32px",
          maxWidth: "380px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #15803d)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <p
          style={{
            color: "#22c55e",
            fontSize: "20px",
            fontWeight: 800,
            margin: "0 0 10px",
          }}
        >
          VSN Verified -- Queued
        </p>
        <p
          style={{
            color: "#9ca3af",
            fontSize: "14px",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          Your withdrawal has been verified and is queued for processing.
        </p>
      </div>
      <button
        onClick={() => {
          setWithdrawStep("form");
          setWithdrawAmount("");
          setWithdrawWallet("");
        }}
        style={{
          marginTop: "28px",
          padding: "12px 24px",
          background: "transparent",
          border: "1px solid #333",
          borderRadius: "10px",
          color: "#9ca3af",
          fontSize: "14px",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#22c55e";
          e.currentTarget.style.color = "#22c55e";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#333";
          e.currentTarget.style.color = "#9ca3af";
        }}
      >
        Make Another Withdrawal
      </button>
    </div>
  );

  /* == REVERSAL SCREEN -- AMBER THEME == */
  const ReversalScreen = () => (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <style>{`
        @keyframes reversal-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.85; transform: scale(0.97); } }
        @keyframes reversal-glow { 0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.3), 0 0 40px rgba(245,158,11,0.1); } 50% { box-shadow: 0 0 35px rgba(245,158,11,0.5), 0 0 70px rgba(245,158,11,0.2); } }
        .reversal-icon-wrap { animation: reversal-pulse 2s ease-in-out infinite; }
      `}</style>
      <div
        className="reversal-icon-wrap"
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f59e0b, #b45309)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          animation: "reversal-glow 2s ease-in-out infinite",
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </div>
      <p
        style={{
          color: "#fbbf24",
          fontSize: "22px",
          fontWeight: 800,
          margin: "0 0 12px",
        }}
      >
        Withdrawal Reversal Available
      </p>
      <p
        style={{
          color: "#9ca3af",
          fontSize: "14px",
          lineHeight: 1.65,
          maxWidth: "320px",
          margin: "0 auto 24px",
        }}
      >
        A reversal has been initiated for your recent withdrawal. Click below to
        return the funds to your balance.
      </p>
      <div
        style={{
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "12px",
          padding: "16px 20px",
          maxWidth: "320px",
          margin: "0 auto 20px",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <span style={{ color: "#6b7280", fontSize: "13px" }}>
            Reversal Amount
          </span>
          <span style={{ color: "#fbbf24", fontSize: "13px", fontWeight: 700 }}>
            ${formatMoney(reversalAmount)}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#6b7280", fontSize: "13px" }}>Status</span>
          <span style={{ color: "#fbbf24", fontSize: "13px", fontWeight: 700 }}>
            Pending Reversal
          </span>
        </div>
      </div>
      <button
        onClick={() => setShowReversalModal(true)}
        style={{
          padding: "14px 32px",
          background: "linear-gradient(135deg, #f59e0b, #b45309)",
          border: "none",
          borderRadius: "12px",
          color: "#fff",
          fontWeight: 700,
          fontSize: "16px",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(245,158,11,0.35)",
        }}
      >
        Confirm Reversal
      </button>
    </div>
  );

  return (
    <>
      {logoutMsg && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              background: "#0d9488",
              borderRadius: "50%",
              width: "64px",
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "popIn 0.4s ease",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p style={{ color: "#fff", fontSize: "22px", fontWeight: 700 }}>
            Logged Out Successfully
          </p>
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>
            Redirecting you to home...
          </p>
        </div>
      )}

      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0a",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            flexShrink: 0,
            height: "58px",
            background: "#0d9488",
            borderBottom: "1px solid #065f46",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            position: "relative",
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={logo}
              alt="OmniDev"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "17px" }}>
              OmniDev
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleLogout}
              className="dash-logout-desktop"
              style={{
                display: "none",
                alignItems: "center",
                gap: "8px",
                padding: "9px 20px",
                background: "rgba(0,0,0,0.22)",
                border: "1.5px solid rgba(255,255,255,0.35)",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className="dash-hamburger"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                padding: "8px 10px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span
                style={{
                  width: "18px",
                  height: "2px",
                  background: "#fff",
                  borderRadius: "2px",
                  display: "block",
                }}
              />
              <span
                style={{
                  width: "18px",
                  height: "2px",
                  background: "#fff",
                  borderRadius: "2px",
                  display: "block",
                }}
              />
              <span
                style={{
                  width: "12px",
                  height: "2px",
                  background: "rgba(255,255,255,0.7)",
                  borderRadius: "2px",
                  display: "block",
                }}
              />
            </button>
          </div>
        </header>

        <div
          style={{
            flex: 1,
            display: "flex",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "fixed",
                top: "58px",
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.72)",
                zIndex: 50,
                touchAction: "none",
                WebkitOverflowScrolling: "touch",
              }}
              onTouchMove={(e) => e.preventDefault()}
            />
          )}

          <aside
            className="dash-sidebar"
            style={{
              width: "260px",
              background: "#0f0f13",
              borderLeft: "1px solid #1a1a2e",
              display: "flex",
              flexDirection: "column",
              position: "fixed",
              top: "58px",
              right: 0,
              bottom: 0,
              zIndex: 55,
              transform: sidebarOpen ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
              height: "calc(100dvh - 58px)",
            }}
          >
            <div
              className="dash-sidebar-close-row"
              style={{
                flexShrink: 0,
                display: "none",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "12px 14px",
                borderBottom: "1px solid #1a1a2e",
              }}
            >
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#9ca3af",
                  cursor: "pointer",
                  padding: "6px 8px",
                  display: "flex",
                  alignItems: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.07)")
                }
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div
              className="dash-welcome-mobile"
              style={{
                flexShrink: 0,
                padding: "20px 20px 17px",
                borderBottom: "1px solid #1a1a2e",
              }}
            >
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "12px",
                  margin: "0 0 3px",
                  fontWeight: 500,
                }}
              >
                Welcome back,
              </p>
              <p
                style={{
                  color: "#fff",
                  fontSize: "17px",
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                {displayName}!
              </p>
            </div>
            <nav
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                padding: "10px",
                minHeight: 0,
              }}
            >
              {SIDEBAR_ITEMS.map((item) => {
                const active = activeTab === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      setActiveTab(item.path);
                      setSidebarOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "20px 12px",
                      marginBottom: "4px",
                      borderRadius: "10px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "15px",
                      textAlign: "left",
                      background: active ? "#0d9488" : "transparent",
                      color: active ? "#fff" : "#9ca3af",
                      transition: "background 0.2s, color 0.2s",
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
              {isAdmin && (
                <button
                  onClick={() => {
                    navigate("/admin");
                    setSidebarOpen(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "20px 12px",
                    marginBottom: "4px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "15px",
                    textAlign: "left",
                    background: "transparent",
                    color: "#ef4444",
                  }}
                >
                  <span style={{ flexShrink: 0 }}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  Admin Dashboard
                </button>
              )}
            </nav>
            <div
              className="dash-logout-mobile"
              style={{
                flexShrink: 0,
                padding: "12px 18px",
                borderTop: "1px solid #1a1a2e",
                background: "#0f0f13",
                display: "none",
              }}
            >
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "12px",
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
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
            <div
              className="dash-email-desktop"
              style={{
                flexShrink: 0,
                padding: "16px 18px",
                borderTop: "1px solid #1a1a2e",
                background: "#0f0f13",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  background: "#1a1a1a",
                  borderRadius: "10px",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth="2"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span
                  style={{
                    color: "#9ca3af",
                    fontSize: "13px",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {session?.email}
                </span>
              </div>
            </div>
          </aside>

          <main
            className="dash-main"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "#0a0a0a",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 0,
                backgroundImage:
                  "linear-gradient(rgba(13,148,136,0.18) 1px,transparent 1px),linear-gradient(90deg,rgba(13,148,136,0.18) 1px,transparent 1px)",
                backgroundSize: "80px 80px",
                maskImage:
                  "radial-gradient(ellipse 75% 75% at 50% 50%,transparent 65%,black 100%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 75% 75% at 50% 50%,transparent 35%,black 150%)",
              }}
            />
            <div style={{ position: "relative", zIndex: 2, flexShrink: 0 }}>
              <TickerBar />
            </div>
            <div
              ref={contentScrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  padding: "28px 11px",
                  maxWidth: "900px",
                  margin: "0 auto",
                }}
              >
                {/* == DASHBOARD TAB == */}
                {activeTab === "dashboard" && (
                  <div>
                    <div style={{ marginBottom: "24px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          marginBottom: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "16px",
                            background:
                              "linear-gradient(135deg,#0d9488,#065f46)",
                            border: "2px solid #0d9488",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {profilePic ? (
                            <img
                              src={profilePic}
                              alt="avatar"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <svg
                              width="30"
                              height="30"
                              viewBox="0 0 24 24"
                              fill="white"
                            >
                              <rect x="3" y="3" width="7" height="7" rx="1.5" />
                              <rect
                                x="14"
                                y="3"
                                width="7"
                                height="7"
                                rx="1.5"
                              />
                              <rect
                                x="3"
                                y="14"
                                width="7"
                                height="7"
                                rx="1.5"
                              />
                              <rect
                                x="14"
                                y="14"
                                width="7"
                                height="7"
                                rx="1.5"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h2
                            style={{
                              fontSize: "clamp(25px,4vw,32px)",
                              fontWeight: 800,
                              color: "#fff",
                              margin: "0 0 12px",
                            }}
                          >
                            Dashboard
                          </h2>
                          <p
                            style={{
                              color: "#9ca3af",
                              fontSize: "17px",
                              margin: 0,
                            }}
                          >
                            Hi{" "}
                            <strong style={{ color: "#fff" }}>
                              {displayName}
                            </strong>
                            !
                          </p>
                        </div>
                      </div>
                      <p
                        style={{
                          color: "#9ca3af",
                          fontSize: "16px",
                          margin: "8px 0 0",
                        }}
                      >
                        Topup your account or connect your wallet to start
                        trading.
                      </p>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit,minmax(240px,1fr))",
                        gap: "16px",
                        marginBottom: "28px",
                      }}
                    >
                      <div
                        style={{
                          background: "#111",
                          borderRadius: "18px",
                          padding: "24px",
                          border: "1px solid #222",
                        }}
                      >
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "10px",
                            background: "#0d9488",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "16px",
                          }}
                        >
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="2" y="6" width="20" height="12" rx="2" />
                            <circle cx="12" cy="12" r="2.5" />
                            <path d="M6 10h.01M6 14h.01M18 10h.01M18 14h.01" />
                          </svg>
                        </div>
                        <p
                          style={{
                            color: "#6b7280",
                            fontSize: "12px",
                            margin: "0 0 6px",
                            fontWeight: 600,
                          }}
                        >
                          USD Balance
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "20px",
                          }}
                        >
                          <p
                            key={balance}
                            style={{
                              color: "#fff",
                              fontSize: "30px",
                              fontWeight: 800,
                              margin: 0,
                              animation: "countUp 0.4s ease",
                            }}
                          >
                            {balanceVisible
                              ? `$${formatMoney(balance)}`
                              : "------"}
                          </p>
                          <button
                            onClick={() => setBalanceVisible(!balanceVisible)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#6b7280",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            {balanceVisible ? (
                              <svg
                                width="17"
                                height="17"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            ) : (
                              <svg
                                width="17"
                                height="17"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            marginBottom: "14px",
                          }}
                        >
                          <button
                            onClick={() => setActiveTab("deposit")}
                            style={{
                              flex: 1,
                              padding: "10px",
                              borderRadius: "9px",
                              background: "#0d9488",
                              border: "none",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: "13px",
                              cursor: "pointer",
                            }}
                          >
                            Deposit
                          </button>
                          <button
                            onClick={() => setWalletOpen(true)}
                            style={{
                              flex: 1,
                              padding: "10px",
                              borderRadius: "9px",
                              background: "#0d9488",
                              border: "1px solid #333",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: "13px",
                              cursor: "pointer",
                            }}
                          >
                            Connect Wallet
                          </button>
                        </div>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "7px",
                            background: botDisplay.bgColor,
                            border: `1px solid ${botDisplay.borderColor}`,
                            borderRadius: "999px",
                            padding: "6px 14px",
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: botDisplay.dotColor,
                              flexShrink: 0,
                              boxShadow: `0 0 6px ${botDisplay.dotColor}`,
                              animation:
                                botPhase !== "disabled"
                                  ? "pulse-dot 1.5s ease-in-out infinite"
                                  : "none",
                            }}
                          />
                          <span
                            style={{
                              color: botDisplay.textColor,
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            {botDisplay.text}
                            {botPhase === "analysing" && (
                              <span className="analysing-dots" />
                            )}
                          </span>
                        </div>
                        {botDisplay.subText && botPhase !== "disabled" && (
                          <p
                            style={{
                              color: "#6b7280",
                              fontSize: "11px",
                              margin: "16px 0 0",
                            }}
                          >
                            {botDisplay.subText}
                          </p>
                        )}
                      </div>
                      <div
                        style={{
                          background: "#111",
                          borderRadius: "18px",
                          padding: "24px",
                          border: "1px solid #222",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "12px",
                            background: "#0d9488",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "16px",
                          }}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                        </div>
                        <p
                          style={{
                            color: "#6b7280",
                            fontSize: "11px",
                            margin: "0 0 6px",
                          }}
                        >
                          Total Transactions
                        </p>
                        <p
                          style={{
                            color: "#fff",
                            fontSize: "28px",
                            fontWeight: 800,
                            margin: 0,
                          }}
                        >
                          {userTransactions.length}
                        </p>
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "14px",
                        }}
                      >
                        <h3
                          style={{
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "15px",
                            margin: 0,
                          }}
                        >
                          Recent Transactions
                        </h3>
                        <button
                          onClick={() => setActiveTab("transactions")}
                          style={{
                            background: "#1a1a1a",
                            border: "none",
                            color: "#9ca3af",
                            fontSize: "12px",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                        >
                          View All
                        </button>
                      </div>
                      <div
                        style={{
                          background: "#0d9488",
                          borderRadius: "12px 12px 0 0",
                          padding: "16px 18px",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr 1fr",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          <span>VSN</span>
                          <span style={{ textAlign: "center" }}>Type</span>
                          <span style={{ textAlign: "center" }}>Status</span>
                          <span style={{ textAlign: "right" }}>Amount</span>
                        </div>
                      </div>
                      <div
                        style={{
                          background: "#111",
                          border: "1px solid #222",
                          borderTop: "none",
                          borderRadius: "0 0 12px 12px",
                          maxHeight: "420px",
                          overflowY: "auto",
                        }}
                        className="txn-scroll"
                      >
                        {userTransactions.length === 0 ? (
                          <div
                            style={{
                              padding: "32px 18px",
                              textAlign: "center",
                            }}
                          >
                            <p
                              style={{
                                color: "#4b5563",
                                fontSize: "13px",
                                margin: 0,
                              }}
                            >
                              No recent transactions
                            </p>
                          </div>
                        ) : (
                          userTransactions.slice(0, 5).map((t, i) => (
                            <div
                              key={t.id}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                                padding: "14px 18px",
                                borderBottom:
                                  i < Math.min(userTransactions.length, 5) - 1
                                    ? "1px solid #222"
                                    : "none",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{ color: "#d1d5db", fontSize: "13px" }}
                              >
                                #{t.id.slice(-6).toUpperCase()}
                              </span>
                              <span
                                style={{
                                  color: "#d1d5db",
                                  fontSize: "13px",
                                  textAlign: "center",
                                }}
                              >
                                {getTypeLabel(t.type)}
                              </span>
                              <span style={{ textAlign: "center" }}>
                                {(() => {
                                  const bs = getStatusBadgeStyle(
                                    getLiveStatus(t),
                                    t.type,
                                  );
                                  return (
                                    <span
                                      style={{
                                        background: bs.background,
                                        color: bs.color,
                                        padding: "3px 10px",
                                        borderRadius: "6px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {getLiveStatus(t)}
                                    </span>
                                  );
                                })()}
                              </span>
                              <span
                                style={{
                                  color: getAmountColor(t.type),
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  textAlign: "right",
                                }}
                              >
                                {getAmountPrefix(t.type)}$
                                {formatMoney(t.amount)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* == DEPOSIT TAB == */}
                {activeTab === "deposit" && (
                  <div
                    style={{
                      maxWidth: "420px",
                      margin: "0 auto",
                      textAlign: "center",
                      paddingTop: "32px",
                    }}
                  >
                    <h2
                      style={{
                        color: "#fff",
                        fontSize: "35px",
                        fontWeight: 800,
                        marginBottom: "12px",
                      }}
                    >
                      Topup
                    </h2>
                    <p
                      style={{
                        color: "#9ca3af",
                        fontSize: "18px",
                        marginBottom: "28px",
                        lineHeight: 1.6,
                      }}
                    >
                      Top your connected wallet with a minimum balance of 5 SOL
                      to activate automatic trading.
                    </p>
                    <button
                      onClick={() => setActiveTab("dashboard")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "13px 28px",
                        background: "#0d9488",
                        border: "none",
                        borderRadius: "12px",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "15px",
                        cursor: "pointer",
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="1" y="4" width="22" height="16" rx="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                      Top up
                    </button>
                  </div>
                )}

                {/* == WITHDRAW TAB == */}
                {activeTab === "withdraw" && (
                  <div
                    style={{
                      maxWidth: "420px",
                      margin: "0 auto",
                      paddingTop: "16px",
                    }}
                  >
                    <h2
                      style={{
                        color: "#fff",
                        fontSize: "35px",
                        fontWeight: 800,
                        textAlign: "center",
                        marginBottom: "8px",
                      }}
                    >
                      Withdraw USD
                    </h2>
                    <p
                      style={{
                        color: "#9ca3af",
                        fontSize: "18px",
                        textAlign: "center",
                        marginBottom: "28px",
                      }}
                    >
                      Withdraw your USD into your bank account or preferred
                      payment method
                    </p>

                    {/* Bot trading / analysing lock */}
                    {botPhase === "activated" || botPhase === "analysing" ? (
                      <HourglassLocked />
                    ) : balance <= 0 ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          marginTop: "20px",
                        }}
                      >
                        <div
                          style={{
                            background: "#fff",
                            borderRadius: "18px",
                            padding: "40px 56px",
                            textAlign: "center",
                            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                          }}
                        >
                          <div
                            style={{
                              marginBottom: "14px",
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                background: "rgba(239,68,68,0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2.5"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                            </div>
                          </div>
                          <p
                            style={{
                              color: "#111",
                              fontSize: "20px",
                              fontWeight: 700,
                              margin: 0,
                              lineHeight: 1.5,
                            }}
                          >
                            Insufficient USD
                            <br />
                            Balance
                          </p>
                          <p
                            style={{
                              color: "#6b7280",
                              fontSize: "13px",
                              margin: "10px 0 0",
                            }}
                          >
                            Fund your account to start withdrawing.
                          </p>
                        </div>
                      </div>
                    ) : withdrawStep === "processing" ? (
                      <WithdrawalProcessingScreen />
                    ) : withdrawStep === "vsn_pending" ? (
                      <VsnPendingScreen />
                    ) : withdrawStep === "contact_support" ? (
                      <ContactSupportScreen />
                    ) : withdrawStep === "reversal" ? (
                      <ReversalScreen />
                    ) : (
                      /* -- FORM -- */
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                        }}
                      >
                        {vsnRequired && (
                          <div
                            style={{
                              background: "rgba(124,92,252,0.1)",
                              border: "1px solid rgba(124,92,252,0.3)",
                              borderRadius: "12px",
                              padding: "14px 16px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              animation: "popIn 0.3s ease",
                            }}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#a78bfa"
                              strokeWidth="2"
                            >
                              <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                              />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <div>
                              <p
                                style={{
                                  color: "#a78bfa",
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  margin: "0 0 2px",
                                }}
                              >
                                VSN Code Ready
                              </p>
                              <p
                                style={{
                                  color: "#9ca3af",
                                  fontSize: "12px",
                                  margin: 0,
                                }}
                              >
                                Your VSN code has been issued. Click Withdraw to
                                enter it.
                              </p>
                            </div>
                          </div>
                        )}
                        {withdrawSuccess && (
                          <div
                            style={{
                              background: "rgba(13,148,136,0.1)",
                              border: "1px solid rgba(13,148,136,0.3)",
                              borderRadius: "12px",
                              padding: "14px 16px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              animation: "popIn 0.3s ease",
                            }}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#0d9488"
                              strokeWidth="2"
                            >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span
                              style={{
                                color: "#0d9488",
                                fontSize: "14px",
                                fontWeight: 600,
                              }}
                            >
                              {withdrawSuccess}
                            </span>
                          </div>
                        )}
                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "7px",
                            }}
                          >
                            <label
                              style={{ color: "#9ca3af", fontSize: "13px" }}
                            >
                              Amount
                            </label>
                            <span
                              style={{
                                color: "#0d9488",
                                fontSize: "11px",
                                background: "rgba(13,148,136,0.1)",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                              }}
                              onClick={() => setWithdrawAmount(String(balance))}
                            >
                              Max
                            </span>
                          </div>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Enter USD Amount"
                            value={withdrawAmount}
                            onChange={(e) => {
                              setWithdrawAmount(e.target.value);
                              setWithdrawError("");
                              setWithdrawSuccess("");
                            }}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              background: "#111",
                              border: "1px solid #333",
                              borderRadius: "12px",
                              padding: "13px 16px",
                              color: "#fff",
                              fontSize: "16px",
                              outline: "none",
                            }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              color: "#9ca3af",
                              fontSize: "13px",
                              display: "block",
                              marginBottom: "7px",
                            }}
                          >
                            Payment Details
                          </label>
                          <textarea
                            rows={4}
                            placeholder="Enter your preferred wallet / bank details"
                            value={withdrawWallet}
                            onChange={(e) => {
                              setWithdrawWallet(e.target.value);
                              setWithdrawError("");
                              setWithdrawSuccess("");
                            }}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              background: "#111",
                              border: "1px solid #333",
                              borderRadius: "12px",
                              padding: "13px 16px",
                              color: "#fff",
                              fontSize: "16px",
                              outline: "none",
                              resize: "none",
                            }}
                          />
                        </div>
                        {withdrawError && (
                          <p
                            style={{
                              color: "#f87171",
                              fontSize: "13px",
                              margin: 0,
                            }}
                          >
                            {withdrawError}
                          </p>
                        )}
                        <button
                          onClick={handleWithdrawClick}
                          style={{
                            padding: "14px",
                            background: vsnRequired
                              ? "linear-gradient(135deg,#7C5CFC,#5b3fd4)"
                              : "#0d9488",
                            border: "none",
                            borderRadius: "12px",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "16px",
                            cursor: "pointer",
                          }}
                        >
                          {vsnRequired ? "Enter VSN Code" : "Withdraw"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* == TRANSACTIONS TAB == */}
                {activeTab === "transactions" && (
                  <div>
                    <h2
                      style={{
                        color: "#fff",
                        fontSize: "35px",
                        fontWeight: 800,
                        marginBottom: "20px",
                      }}
                    >
                      Transactions
                    </h2>
                    <div
                      className="txn-filter-bar"
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                        marginBottom: "16px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={txnSearch}
                        onChange={(e) => setTxnSearch(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: "180px",
                          background: "#111",
                          border: "1px solid #333",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          color: "#fff",
                          fontSize: "16px",
                          outline: "none",
                        }}
                      />
                      <select
                        value={txnFilter}
                        onChange={(e) => setTxnFilter(e.target.value)}
                        style={{
                          background: "#111",
                          border: "1px solid #333",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          color: "#fff",
                          fontSize: "16px",
                          outline: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="All Types">All Types</option>
                        <option value="Deposit">Deposit</option>
                        <option value="Withdrawal">Withdrawal</option>
                        <option value="Solana">Solana</option>
                        <option value="Reversal">Reversal</option>
                        <option value="VSN">VSN</option>
                      </select>
                      <button
                        onClick={handleExportTransactions}
                        style={{
                          padding: "10px 20px",
                          background: "#0d9488",
                          border: "none",
                          borderRadius: "10px",
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export
                      </button>
                    </div>
                    <div
                      style={{
                        background: "#0d9488",
                        borderRadius: "12px 12px 0 0",
                        padding: "16px 18px",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr 1fr",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        <span>VSN</span>
                        <span style={{ textAlign: "center" }}>Type</span>
                        <span style={{ textAlign: "center" }}>Status</span>
                        <span style={{ textAlign: "right" }}>Amount</span>
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#111",
                        border: "1px solid #222",
                        borderTop: "none",
                        borderRadius: "0 0 12px 12px",
                        maxHeight: "520px",
                        overflowY: "auto",
                      }}
                      className="txn-scroll"
                    >
                      {userTransactions.length === 0 ? (
                        <div style={{ padding: "48px", textAlign: "center" }}>
                          <p
                            style={{
                              color: "#4b5563",
                              fontSize: "13px",
                              margin: 0,
                            }}
                          >
                            No transactions found
                          </p>
                        </div>
                      ) : (
                        filteredTransactions.map((t, i) => (
                          <div
                            key={t.id}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr 1fr 1fr",
                              padding: "14px 18px",
                              borderBottom:
                                i < filteredTransactions.length - 1
                                  ? "1px solid #222"
                                  : "none",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{ color: "#d1d5db", fontSize: "13px" }}
                            >
                              #{t.id.slice(-6).toUpperCase()}
                            </span>
                            <span
                              style={{
                                color: "#d1d5db",
                                fontSize: "13px",
                                textAlign: "center",
                              }}
                            >
                              {getTypeLabel(t.type)}
                            </span>
                            <span style={{ textAlign: "center" }}>
                              {(() => {
                                const bs = getStatusBadgeStyle(
                                  getLiveStatus(t),
                                  t.type,
                                );
                                return (
                                  <span
                                    style={{
                                      background: bs.background,
                                      color: bs.color,
                                      padding: "3px 10px",
                                      borderRadius: "6px",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      textTransform: "capitalize",
                                    }}
                                  >
                                    {getLiveStatus(t)}
                                  </span>
                                );
                              })()}
                            </span>
                            <span
                              style={{
                                color: getAmountColor(t.type),
                                fontSize: "13px",
                                fontWeight: 700,
                                textAlign: "right",
                              }}
                            >
                              {getAmountPrefix(t.type)}${formatMoney(t.amount)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* == PROFILE TAB == */}
                {activeTab === "profile" && (
                  <div
                    style={{
                      maxWidth: "420px",
                      margin: "0 auto",
                      paddingTop: "16px",
                    }}
                  >
                    <h2
                      style={{
                        color: "#fff",
                        fontSize: "35px",
                        fontWeight: 800,
                        textAlign: "center",
                        marginBottom: "6px",
                      }}
                    >
                      Profile
                    </h2>
                    {profileLoading ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "#6b7280",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            border: "3px solid #1a1a1a",
                            borderTop: "3px solid #0d9488",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 16px",
                          }}
                        />
                        <p style={{ fontSize: "14px" }}>Loading profile...</p>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{ textAlign: "center", marginBottom: "28px" }}
                        >
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              width: "84px",
                              height: "84px",
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg,#0d9488,#065f46)",
                              margin: "0 auto 10px",
                              cursor: "pointer",
                              overflow: "hidden",
                              border: "3px solid #0d9488",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {profilePic ? (
                              <img
                                src={profilePic}
                                alt="Profile"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <svg
                                width="38"
                                height="38"
                                viewBox="0 0 24 24"
                                fill="white"
                              >
                                <rect
                                  x="3"
                                  y="3"
                                  width="7"
                                  height="7"
                                  rx="1.5"
                                />
                                <rect
                                  x="14"
                                  y="3"
                                  width="7"
                                  height="7"
                                  rx="1.5"
                                />
                                <rect
                                  x="3"
                                  y="14"
                                  width="7"
                                  height="7"
                                  rx="1.5"
                                />
                                <rect
                                  x="14"
                                  y="14"
                                  width="7"
                                  height="7"
                                  rx="1.5"
                                />
                              </svg>
                            )}
                          </div>
                          <p
                            style={{
                              color: "#6b7280",
                              fontSize: "11px",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              marginBottom: "12px",
                            }}
                          >
                            Tap to update picture
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                          />
                        </div>
                        {!profileForm.firstName && !profileForm.lastName && (
                          <div
                            style={{
                              background: "rgba(13,148,136,0.1)",
                              border: "1px solid rgba(13,148,136,0.2)",
                              borderRadius: "10px",
                              padding: "12px",
                              marginBottom: "20px",
                              textAlign: "center",
                            }}
                          >
                            <p
                              style={{
                                color: "#0d9488",
                                fontSize: "13px",
                                margin: 0,
                              }}
                            >
                              Complete your profile -- some details are missing
                              from your account.
                            </p>
                          </div>
                        )}
                        {profileError && (
                          <div
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              border: "1px solid rgba(239,68,68,0.3)",
                              borderRadius: "10px",
                              padding: "11px 16px",
                              color: "#f87171",
                              fontSize: "13px",
                              marginBottom: "16px",
                              textAlign: "center",
                            }}
                          >
                            {profileError}
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "13px",
                          }}
                        >
                          {[
                            { label: "First Name", key: "firstName" },
                            { label: "Last Name", key: "lastName" },
                          ].map(({ label, key }) => (
                            <div key={key}>
                              <label
                                style={{
                                  color: "#6b7280",
                                  fontSize: "11px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.08em",
                                  marginBottom: "4px",
                                  display: "block",
                                }}
                              >
                                {label}
                              </label>
                              <input
                                type="text"
                                value={profileForm[key]}
                                readOnly
                                style={{
                                  width: "100%",
                                  boxSizing: "border-box",
                                  background: "#0d0d0d",
                                  border: "1px solid #2a2a2a",
                                  borderRadius: "10px",
                                  padding: "13px 16px",
                                  color: profileForm[key]
                                    ? "#6b7280"
                                    : "#ef4444",
                                  fontSize: "16px",
                                  outline: "none",
                                  cursor: "not-allowed",
                                }}
                              />
                            </div>
                          ))}
                          <div>
                            <label
                              style={{
                                color: "#0d9488",
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                marginBottom: "4px",
                                display: "block",
                              }}
                            >
                              Username (Editable)
                            </label>
                            <input
                              type="text"
                              value={profileForm.username}
                              onChange={(e) => {
                                setProfileForm({
                                  ...profileForm,
                                  username: e.target.value,
                                });
                                setProfileError("");
                              }}
                              style={{
                                width: "100%",
                                boxSizing: "border-box",
                                background: "#111",
                                border: "1px solid #333",
                                borderRadius: "10px",
                                padding: "13px 16px",
                                color: "#fff",
                                fontSize: "16px",
                                outline: "none",
                              }}
                            />
                          </div>
                          <div>
                            <label
                              style={{
                                color: "#6b7280",
                                fontSize: "11px",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                marginBottom: "4px",
                                display: "block",
                              }}
                            >
                              Email
                            </label>
                            <div style={{ position: "relative" }}>
                              <input
                                type="email"
                                value={profileForm.email}
                                readOnly
                                style={{
                                  width: "100%",
                                  boxSizing: "border-box",
                                  background: "#0d0d0d",
                                  border: "1px solid #2a2a2a",
                                  borderRadius: "10px",
                                  padding: "13px 16px 13px 42px",
                                  color: "#6b7280",
                                  fontSize: "16px",
                                  outline: "none",
                                  cursor: "not-allowed",
                                }}
                              />
                              <span
                                style={{
                                  position: "absolute",
                                  left: "14px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  color: "#4b5563",
                                }}
                              >
                                <svg
                                  width="15"
                                  height="15"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect
                                    x="3"
                                    y="11"
                                    width="18"
                                    height="11"
                                    rx="2"
                                  />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                              </span>
                              <span
                                style={{
                                  position: "absolute",
                                  right: "12px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  color: "#4b5563",
                                  fontSize: "11px",
                                  background: "#1a1a1a",
                                  padding: "2px 8px",
                                  borderRadius: "5px",
                                }}
                              >
                                locked
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={handleProfileSave}
                            disabled={profileSaved}
                            style={{
                              padding: "14px",
                              background: profileSaved ? "#065f46" : "#0d9488",
                              border: profileSaved
                                ? "1px solid #0d9488"
                                : "none",
                              borderRadius: "10px",
                              color: profileSaved ? "#0d9488" : "#fff",
                              fontWeight: 700,
                              fontSize: "16px",
                              cursor: profileSaved ? "default" : "pointer",
                              transition: "all 0.3s ease",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                            }}
                          >
                            {profileSaved ? (
                              <>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                >
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                  <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                Saved!
                              </>
                            ) : savingProfile ? (
                              <>
                                <div
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    border: "2.5px solid rgba(255,255,255,0.3)",
                                    borderTop: "2.5px solid #fff",
                                    borderRadius: "50%",
                                    animation: "spin 0.7s linear infinite",
                                    flexShrink: 0,
                                  }}
                                />
                                Saving...
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div
              className="dash-footer-desktop"
              style={{
                flexShrink: 0,
                borderTop: "1px solid #1a1a2e",
                padding: "14px 20px",
                textAlign: "center",
                background: "#0a0a0a",
                position: "relative",
                zIndex: 2,
              }}
            >
              <p
                style={{
                  color: "rgba(13,148,136,0.5)",
                  fontSize: "11px",
                  margin: 0,
                }}
              >
                © {new Date().getFullYear()} OmniDev. All rights reserved.
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* == MOBILE BOTTOM NAV == */}
      <div
        className="mobile-bottom-nav"
        style={{
          display: "none",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#0f0f13",
          borderTop: "1px solid #1a1a2e",
          padding: "8px 0 12px",
          zIndex: 50,
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        {[
          {
            label: "Home",
            path: "dashboard",
            icon: (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            ),
          },
          {
            label: "Deposit",
            path: "deposit",
            icon: (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            ),
          },
          {
            label: "Withdraw",
            path: "withdraw",
            icon: (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            ),
          },
          {
            label: "History",
            path: "transactions",
            icon: (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            ),
          },
          {
            label: "Profile",
            path: "profile",
            icon: (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ),
          },
        ].map((item) => {
          const active = activeTab === item.path;
          return (
            <button
              key={item.path}
              onClick={() => setActiveTab(item.path)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                color: active ? "#0d9488" : "#6b7280",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                padding: "4px 8px",
                transition: "color 0.2s",
              }}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>

      {/* == VSN CODE MODAL -- PURPLE THEME == */}
      {showVsnModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.80)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#13131f",
              borderRadius: "24px",
              padding: "40px 32px",
              maxWidth: "390px",
              width: "100%",
              textAlign: "center",
              border: "1px solid rgba(124,92,252,0.25)",
              animation: "vsnSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                background: "linear-gradient(135deg,#7C5CFC,#5b3fd4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 22px",
                boxShadow: "0 8px 24px rgba(124,92,252,0.4)",
              }}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <circle cx="12" cy="16" r="1.5" fill="white" />
              </svg>
            </div>
            <h3
              style={{
                color: "#fff",
                fontSize: "22px",
                fontWeight: 800,
                margin: "0 0 10px",
                letterSpacing: "-0.3px",
              }}
            >
              Enter VSN Code
            </h3>
            <p
              style={{
                color: "#9ca3af",
                fontSize: "14px",
                lineHeight: 1.65,
                margin: "0 0 28px",
              }}
            >
              Enter the VSN code provided by our support team to complete your
              withdrawal.
            </p>
            {vsnSuccess ? (
              <div
                style={{
                  padding: "20px",
                  background: "rgba(13,148,136,0.12)",
                  borderRadius: "14px",
                  border: "1px solid rgba(13,148,136,0.3)",
                  animation: "popIn 0.3s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="2.5"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p
                    style={{
                      color: "#0d9488",
                      fontWeight: 700,
                      margin: 0,
                      fontSize: "15px",
                    }}
                  >
                    VSN Verified!
                  </p>
                </div>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "13px",
                    margin: "8px 0 0",
                  }}
                >
                  Your withdrawal is being processed.
                </p>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  className="vsn-input"
                  placeholder="Enter your VSN code"
                  value={vsnInput}
                  onChange={(e) => {
                    setVsnInput(e.target.value);
                    setVsnError("");
                  }}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#1a1a2e",
                    border: vsnError
                      ? "1.5px solid #ef4444"
                      : "1.5px solid rgba(124,92,252,0.3)",
                    borderRadius: "12px",
                    padding: "15px 16px",
                    color: "#fff",
                    fontSize: "18px",
                    outline: "none",
                    marginBottom: "10px",
                    textAlign: "center",
                    letterSpacing: "0.2em",
                    fontWeight: 700,
                    transition: "border-color 0.2s",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleVsnSubmit()}
                />
                {vsnError && (
                  <p
                    style={{
                      color: "#f87171",
                      fontSize: "13px",
                      marginBottom: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {vsnError}
                  </p>
                )}
                <button
                  onClick={handleVsnSubmit}
                  disabled={vsnLoading}
                  style={{
                    width: "100%",
                    padding: "15px",
                    background: vsnLoading
                      ? "rgba(124,92,252,0.5)"
                      : "linear-gradient(135deg,#7C5CFC,#5b3fd4)",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "16px",
                    cursor: vsnLoading ? "default" : "pointer",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: vsnLoading
                      ? "none"
                      : "0 4px 16px rgba(124,92,252,0.35)",
                    transition: "all 0.2s",
                  }}
                >
                  {vsnLoading ? (
                    <>
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2.5px solid rgba(255,255,255,0.3)",
                          borderTop: "2.5px solid #fff",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                        }}
                      />
                      Verifying...
                    </>
                  ) : (
                    "Proceed"
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowVsnModal(false);
                    setVsnInput("");
                    setVsnError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#6b7280",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: "4px 12px",
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* == REVERSAL CONFIRMATION MODAL -- AMBER THEME == */}
      {showReversalModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.80)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#13131f",
              borderRadius: "24px",
              padding: "40px 32px",
              maxWidth: "390px",
              width: "100%",
              textAlign: "center",
              border: "1px solid rgba(245,158,11,0.25)",
              animation: "vsnSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                background: "linear-gradient(135deg,#f59e0b,#b45309)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 22px",
                boxShadow: "0 8px 24px rgba(245,158,11,0.4)",
              }}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </div>
            <h3
              style={{
                color: "#fff",
                fontSize: "22px",
                fontWeight: 800,
                margin: "0 0 10px",
                letterSpacing: "-0.3px",
              }}
            >
              Confirm Reversal
            </h3>
            <p
              style={{
                color: "#9ca3af",
                fontSize: "14px",
                lineHeight: 1.65,
                margin: "0 0 28px",
              }}
            >
              You are about to reverse{" "}
              <strong style={{ color: "#fbbf24" }}>
                ${formatMoney(reversalAmount)}
              </strong>{" "}
              back to your balance. This action cannot be undone.
            </p>
            {reversalError && (
              <p
                style={{
                  color: "#f87171",
                  fontSize: "13px",
                  marginBottom: "14px",
                  fontWeight: 500,
                }}
              >
                {reversalError}
              </p>
            )}
            <button
              onClick={handleReversal}
              disabled={reversalLoading}
              style={{
                width: "100%",
                padding: "15px",
                background: reversalLoading
                  ? "rgba(245,158,11,0.5)"
                  : "linear-gradient(135deg,#f59e0b,#b45309)",
                border: "none",
                borderRadius: "12px",
                color: "#fff",
                fontWeight: 700,
                fontSize: "16px",
                cursor: reversalLoading ? "default" : "pointer",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: reversalLoading
                  ? "none"
                  : "0 4px 16px rgba(245,158,11,0.35)",
                transition: "all 0.2s",
              }}
            >
              {reversalLoading ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2.5px solid rgba(255,255,255,0.3)",
                      borderTop: "2.5px solid #fff",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  Processing...
                </>
              ) : (
                "Confirm Reversal"
              )}
            </button>
            <button
              onClick={() => {
                setShowReversalModal(false);
                setReversalError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#6b7280",
                fontSize: "14px",
                cursor: "pointer",
                padding: "4px 12px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConnectWallet isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
    </>
  );
}
