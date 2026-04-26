import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "/src/images/omnidev logo.png";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import { TickerBar } from "./TickerBar";

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
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
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
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

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

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
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
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const pic = ev.target.result;
      setProfilePic(pic);
      await setDoc(
        doc(db, "profiles", session.uid),
        { picture: pic, username: profileForm.username },
        { merge: true },
      );
    };
    reader.readAsDataURL(file);
  };

  const isUsernameTakenByOther = async (username) => {
    const q = query(
      collection(db, "users"),
      where("username", "==", username.toLowerCase().trim()),
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;
    return snapshot.docs[0].id !== session.uid;
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
        { username: newUsername, picture: profilePic },
        { merge: true },
      );
      await setDoc(
        doc(db, "users", session.uid),
        { username: newUsername },
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

  if (!session) return null;

  const account =
    JSON.parse(localStorage.getItem("omnidev_accounts") || "{}")[
      session?.email
    ] || {};
  const balance = account.balance || 0;
  const transactions = account.transactions || [];
  const displayName =
    profileForm.username || session?.email?.split("@")[0] || "";

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
            Redirecting you to home…
          </p>
          <style>{`@keyframes popIn{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
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
        {/* HEADER */}
        <header
          style={{
            flexShrink: 0,
            height: "58px",
            background: "#0d9488",
            borderBottom: "1px solid #0b7b72",
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
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(0,0,0,0.4)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(0,0,0,0.22)")
              }
            >
              Logout
            </button>

            <button
              onClick={() => setSidebarOpen(true)}
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

        {/* BODY */}
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
                inset: 0,
                background: "rgba(0,0,0,0.72)",
                zIndex: 40,
              }}
            />
          )}

          {/* SIDEBAR — slides from RIGHT on mobile */}
          <aside
            className="dash-sidebar"
            style={{
              width: "260px",
              flexShrink: 0,
              background: "#0f0f13",
              borderRight: "1px solid #1a1a2e",
              display: "flex",
              flexDirection: "column",
              position: "fixed",
              top: 0,
              right: 0,
              height: "100vh",
              zIndex: 45,
              transform: sidebarOpen ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 14px",
                borderBottom: "1px solid #1a1a2e",
                flexShrink: 0,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <img
                  src={logo}
                  alt="OmniDev"
                  style={{ width: "28px", height: "28px", borderRadius: "50%" }}
                />
                <span
                  style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}
                >
                  Menu
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav style={{ padding: "10px 8px", flex: 1 }}>
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
                      padding: "14px",
                      marginBottom: "3px",
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
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background =
                          "rgba(13,148,136,0.1)";
                        e.currentTarget.style.color = "#e5e7eb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#9ca3af";
                      }
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div
              style={{
                padding: "14px",
                borderTop: "1px solid #1a1a2e",
                flexShrink: 0,
              }}
            >
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  background: "transparent",
                  border: "1px solid #333",
                  borderRadius: "10px",
                  color: "#9ca3af",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ef4444";
                  e.currentTarget.style.borderColor = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9ca3af";
                  e.currentTarget.style.borderColor = "#333";
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          </aside>

          {/* MAIN */}
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
                  "linear-gradient(rgba(13,148,136,0.28) 1px,transparent 1px),linear-gradient(90deg,rgba(13,148,136,0.28) 1px,transparent 1px)",
                backgroundSize: "80px 80px",
                maskImage:
                  "radial-gradient(ellipse 75% 75% at 50% 50%,transparent 65%,black 100%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 75% 75% at 50% 50%,transparent 35%,black 150%)",
              }}
            />

            {/* ✅ TICKER BAR — now using the imported component */}
            <div style={{ position: "relative", zIndex: 2, flexShrink: 0 }}>
              <TickerBar />
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  padding: "28px 20px",
                  maxWidth: "900px",
                  margin: "0 auto",
                }}
              >
                {/* DASHBOARD TAB */}
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
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="1.8"
                            >
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h2
                            style={{
                              fontSize: "clamp(30px,4vw,32px)",
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
                          fontSize: "18px",
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
                          >
                            <rect x="1" y="4" width="22" height="16" rx="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
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
                            style={{
                              color: "#fff",
                              fontSize: "30px",
                              fontWeight: 800,
                              margin: 0,
                            }}
                          >
                            {balanceVisible
                              ? `$${balance.toFixed(2)}`
                              : "••••••"}
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
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#0b7b72")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "#0d9488")
                            }
                          >
                            Deposit
                          </button>
                          <button
                            style={{
                              flex: 1,
                              padding: "10px",
                              borderRadius: "9px",
                              background: "#134e4a",
                              border: "1px solid #0d9488",
                              color: "#5eead4",
                              fontWeight: 700,
                              fontSize: "13px",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#0d9488";
                              e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#134e4a";
                              e.currentTarget.style.color = "#5eead4";
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
                            background: "#1a1a1a",
                            border: "1px solid #2a2a2a",
                            borderRadius: "999px",
                            padding: "6px 14px",
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#ef4444",
                              flexShrink: 0,
                              boxShadow: "0 0 6px rgba(239,68,68,0.6)",
                            }}
                          />
                          <span
                            style={{
                              color: "#9ca3af",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            Bot Trading Disabled
                          </span>
                        </div>
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
                          >
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
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
                          {transactions.length}
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
                          padding: "11px 18px",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          <span>VSN</span>
                          <span style={{ textAlign: "center" }}>Type</span>
                          <span style={{ textAlign: "right" }}>Amount</span>
                        </div>
                      </div>
                      <div
                        style={{
                          background: "#111",
                          border: "1px solid #222",
                          borderTop: "none",
                          borderRadius: "0 0 12px 12px",
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
                    </div>
                  </div>
                )}

                {/* DEPOSIT TAB */}
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
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#0f766e")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#0d9488")
                      }
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

                {/* WITHDRAW TAB */}
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
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "7px",
                          }}
                        >
                          <label style={{ color: "#9ca3af", fontSize: "13px" }}>
                            Amount
                          </label>
                          <span
                            style={{
                              color: "#0d9488",
                              fontSize: "11px",
                              background: "rgba(13,148,136,0.1)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                            }}
                          >
                            Max
                          </span>
                        </div>
                        <input
                          type="number"
                          placeholder="Enter USD Amount"
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
                          onFocus={(e) =>
                            (e.target.style.borderColor = "#0d9488")
                          }
                          onBlur={(e) => (e.target.style.borderColor = "#333")}
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
                          placeholder="Enter Your Payment Details"
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
                          onFocus={(e) =>
                            (e.target.style.borderColor = "#0d9488")
                          }
                          onBlur={(e) => (e.target.style.borderColor = "#333")}
                        />
                      </div>
                      <button
                        style={{
                          padding: "14px",
                          background: "#0d9488",
                          border: "none",
                          borderRadius: "12px",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "16px",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#0f766e")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#0d9488")
                        }
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                )}

                {/* TRANSACTIONS TAB */}
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
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                        marginBottom: "16px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Search transactions…"
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
                        style={{
                          background: "#111",
                          border: "1px solid #333",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          color: "#fff",
                          fontSize: "16px",
                          outline: "none",
                        }}
                      >
                        <option>All Types</option>
                        <option>Deposit</option>
                        <option>Withdrawal</option>
                      </select>
                      <button
                        style={{
                          padding: "10px 20px",
                          background: "#0d9488",
                          border: "none",
                          borderRadius: "10px",
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Export
                      </button>
                    </div>
                    <div
                      style={{
                        background: "#0d9488",
                        borderRadius: "12px 12px 0 0",
                        padding: "11px 18px",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        <span>VSN</span>
                        <span style={{ textAlign: "center" }}>Type</span>
                        <span style={{ textAlign: "right" }}>Amount</span>
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#111",
                        border: "1px solid #222",
                        borderTop: "none",
                        borderRadius: "0 0 12px 12px",
                      }}
                    >
                      {transactions.length === 0 ? (
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
                        transactions.map((t, i) => (
                          <div
                            key={i}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr 1fr",
                              padding: "14px 18px",
                              borderBottom:
                                i < transactions.length - 1
                                  ? "1px solid #222"
                                  : "none",
                            }}
                          >
                            <span
                              style={{ color: "#d1d5db", fontSize: "13px" }}
                            >
                              {t.vsn || "-"}
                            </span>
                            <span
                              style={{
                                color: "#d1d5db",
                                fontSize: "13px",
                                textAlign: "center",
                              }}
                            >
                              {t.type}
                            </span>
                            <span
                              style={{
                                color: "#0d9488",
                                fontSize: "13px",
                                fontWeight: 700,
                                textAlign: "right",
                              }}
                            >
                              ${t.amount}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* PROFILE TAB */}
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
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
                              background: "#0d9488",
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
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="1.5"
                              >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
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
                              ⚠️ Complete your profile — some details are
                              missing from your account.
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
                              First Name
                            </label>
                            <input
                              type="text"
                              value={profileForm.firstName}
                              readOnly
                              style={{
                                width: "100%",
                                boxSizing: "border-box",
                                background: "#0d0d0d",
                                border: "1px solid #2a2a2a",
                                borderRadius: "10px",
                                padding: "13px 16px",
                                color: profileForm.firstName
                                  ? "#6b7280"
                                  : "#ef4444",
                                fontSize: "16px",
                                outline: "none",
                                cursor: "not-allowed",
                              }}
                            />
                            {!profileForm.firstName && (
                              <span
                                style={{
                                  color: "#ef4444",
                                  fontSize: "11px",
                                  marginTop: "4px",
                                  display: "block",
                                }}
                              >
                                Missing — sign up again or contact support
                              </span>
                            )}
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
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={profileForm.lastName}
                              readOnly
                              style={{
                                width: "100%",
                                boxSizing: "border-box",
                                background: "#0d0d0d",
                                border: "1px solid #2a2a2a",
                                borderRadius: "10px",
                                padding: "13px 16px",
                                color: profileForm.lastName
                                  ? "#6b7280"
                                  : "#ef4444",
                                fontSize: "16px",
                                outline: "none",
                                cursor: "not-allowed",
                              }}
                            />
                          </div>

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
                              onFocus={(e) =>
                                (e.target.style.borderColor = "#0d9488")
                              }
                              onBlur={(e) =>
                                (e.target.style.borderColor = "#333")
                              }
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
                                ? "1px solid #34d399"
                                : "none",
                              borderRadius: "10px",
                              color: profileSaved ? "#34d399" : "#fff",
                              fontWeight: 700,
                              fontSize: "16px",
                              cursor: profileSaved ? "default" : "pointer",
                              transition: "all 0.3s ease",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                            }}
                            onMouseEnter={(e) => {
                              if (!profileSaved)
                                e.currentTarget.style.background = "#0f766e";
                            }}
                            onMouseLeave={(e) => {
                              if (!profileSaved)
                                e.currentTarget.style.background = profileSaved
                                  ? "#065f46"
                                  : "#0d9488";
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
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div
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
    </>
  );
}
