import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "/src/images/omnidev logo.png";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

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

const TICKER_COINS = [
  {
    symbol: "BTC",
    wsSymbol: "btcusdt",
    logo: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  },
  {
    symbol: "ETH",
    wsSymbol: "ethusdt",
    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  {
    symbol: "BNB",
    wsSymbol: "bnbusdt",
    logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  },
  {
    symbol: "SOL",
    wsSymbol: "solusdt",
    logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  },
  {
    symbol: "XRP",
    wsSymbol: "xrpusdt",
    logo: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  },
  {
    symbol: "ADA",
    wsSymbol: "adausdt",
    logo: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  },
  {
    symbol: "DOT",
    wsSymbol: "dotusdt",
    logo: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  },
  {
    symbol: "LINK",
    wsSymbol: "linkusdt",
    logo: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  },
  {
    symbol: "AVAX",
    wsSymbol: "avaxusdt",
    logo: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  },
  {
    symbol: "DOGE",
    wsSymbol: "dogeusdt",
    logo: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  },
  {
    symbol: "TRX",
    wsSymbol: "trxusdt",
    logo: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
  },
];

const LiveTickerBar = () => {
  const [prices, setPrices] = useState({});
  const [flash, setFlash] = useState({});
  const prevRef = useRef({});
  const timers = useRef({});

  useEffect(() => {
    const streams = TICKER_COINS.map((c) => `${c.wsSymbol}@miniTicker`).join(
      "/",
    );
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${streams}`,
    );
    ws.onmessage = (ev) => {
      try {
        const { data: d } = JSON.parse(ev.data);
        if (!d?.s) return;
        const sym = d.s.replace("USDT", "");
        const coin = TICKER_COINS.find((c) => c.symbol === sym);
        if (!coin) return;
        const newP = parseFloat(d.c);
        const open = parseFloat(d.o);
        const change = ((newP - open) / open) * 100;
        const prev = prevRef.current[sym]?.price;
        const dir =
          prev !== undefined
            ? newP > prev
              ? "up"
              : newP < prev
                ? "down"
                : null
            : null;
        prevRef.current[sym] = { price: newP, change };
        setPrices((p) => ({ ...p, [sym]: { price: newP, change } }));
        if (dir) {
          if (timers.current[sym]) clearTimeout(timers.current[sym]);
          setFlash((p) => ({ ...p, [sym]: dir }));
          timers.current[sym] = setTimeout(
            () => setFlash((p) => ({ ...p, [sym]: null })),
            800,
          );
        }
      } catch (_) {}
    };
    return () => {
      ws.close();
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const fmt = (p) =>
    p < 1
      ? p.toFixed(4)
      : p.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  const items = [...TICKER_COINS, ...TICKER_COINS];

  return (
    <div
      style={{
        background: "#0d0d0d",
        borderBottom: "1px solid #1a1a1a",
        overflow: "hidden",
        height: "38px",
        display: "flex",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "max-content",
          animation: "dashTicker 36s linear infinite",
          whiteSpace: "nowrap",
          willChange: "transform",
          flexShrink: 0,
        }}
      >
        {items.map((coin, i) => {
          const data = prices[coin.symbol];
          const fl = flash[coin.symbol];
          return (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                padding: "0 22px",
                borderRight: "1px solid #1f1f1f",
                flexShrink: 0,
              }}
            >
              <img
                src={coin.logo}
                alt={coin.symbol}
                style={{ width: "16px", height: "16px", borderRadius: "50%" }}
              />
              <span style={{ color: "#9ca3af", fontWeight: 600 }}>
                {coin.symbol}
              </span>
              <span
                style={{
                  color:
                    fl === "up"
                      ? "#22c55e"
                      : fl === "down"
                        ? "#ef4444"
                        : "#fff",
                  fontWeight: 500,
                  transition: "color 0.15s",
                  minWidth: "64px",
                  display: "inline-block",
                }}
              >
                ${data ? fmt(data.price) : "—"}
              </span>
              {data && (
                <span
                  style={{
                    color: data.change >= 0 ? "#22c55e" : "#ef4444",
                    fontSize: "11px",
                  }}
                >
                  {data.change >= 0 ? "▲" : "▼"}{" "}
                  {Math.abs(data.change).toFixed(2)}%
                </span>
              )}
            </span>
          );
        })}
      </div>
      <style>{`@keyframes dashTicker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
    </div>
  );
};

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [logoutMsg, setLogoutMsg] = useState(false);
  const navigate = useNavigate();

  const [profilePic, setProfilePic] = useState(null);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
        return;
      }
      const s = { email: user.email, uid: user.uid };
      setSession(s);
      const saved = JSON.parse(
        localStorage.getItem(`omnidev_profile_${user.uid}`) || "{}",
      );
      setProfileForm({
        firstName: saved.firstName || "",
        lastName: saved.lastName || "",
        username: saved.username || user.email.split("@")[0],
      });
      setProfilePic(saved.picture || null);
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
    await signOut(auth); // ✅ THIS is the real logout
    localStorage.removeItem("omnidev_session");
    navigate("/login");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePic(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleProfileSave = () => {
    if (!session) return;
    localStorage.setItem(
      `omnidev_profile_${session.uid}`,
      JSON.stringify({ ...profileForm, picture: profilePic }),
    );
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  if (!session) return null;

  const account = (() => {
    const accounts = JSON.parse(
      localStorage.getItem("omnidev_accounts") || "{}",
    );
    return accounts[session.email] || {};
  })();
  const balance = account.balance || 0;
  const transactions = account.transactions || [];
  const displayName =
    profileForm.username ||
    profileForm.firstName ||
    session.email.split("@")[0];

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
          minHeight: "100vh",
          background: "#0a0a0a",
          color: "#fff",
          overflowX: "hidden",
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── FIXED TOP HEADER ── */}
        <header
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            height: "58px",
            background: "#0d9488",
            borderBottom: "1px solid #0b7b72",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
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

          {/* Desktop logout — teal/white style, no purple */}
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
              transition: "background 0.2s",
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

          {/* Mobile hamburger */}
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
        </header>

        <div style={{ height: "60px", flexShrink: 0 }} />

        <div style={{ display: "flex", flex: 1, position: "relative" }}>
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

          {/* ── SIDEBAR ── */}
          <aside
            className="dash-sidebar"
            style={{
              width: "232px",
              flexShrink: 0,
              background: "#0f0f13",
              borderRight: "1px solid #1a1a2e",
              position: "fixed",
              top: "58px",
              left: 0,
              height: "calc(100vh - 58px)",
              zIndex: 45,
              display: "flex", // ✅ ADD THIS
              flexDirection: "column", // ✅ ADD THIS
            }}
          >
            {/* X close button — hidden on desktop via CSS */}
            <div
              style={{
                padding: "14px 16px 10px",
                borderBottom: "1px solid #1a1a2e",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="dash-sidebar-close"
                style={{
                  background: "none",
                  border: "none",
                  color: "#0d9488",
                  cursor: "pointer",
                  padding: "2px",
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
                      padding: "11px 14px",
                      marginBottom: "3px",
                      borderRadius: "10px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "14px",
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

            <div style={{ padding: "14px", borderTop: "1px solid #1a1a2e" }}>
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "11px",
                  background: "transparent",
                  border: "1px solid #333",
                  borderRadius: "10px",
                  color: "#9ca3af",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "color 0.2s, border-color 0.2s",
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
                  width="15"
                  height="15"
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

          {/* ── MAIN CONTENT ── */}
          <main
            className="dash-main"
            style={{
              flex: 1,
              overflowY: "auto",
              background: "#0a0a0a",
              position: "relative",
              minHeight: "calc(100vh - 58px)",
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

            <div
              style={{
                position: "relative",
                zIndex: 2,
                borderBottom: "1px solid #1a1a1a",
              }}
            >
              <LiveTickerBar />
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 1,
                padding: "28px 20px",
                maxWidth: "900px",
                margin: "0 auto",
              }}
            >
              {/* ── DASHBOARD TAB ── */}
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
                          background: "linear-gradient(135deg,#0d9488,#065f46)",
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
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h2
                          style={{
                            fontSize: "clamp(22px,4vw,32px)",
                            fontWeight: 800,
                            color: "#fff",
                            margin: "0 0 2px",
                          }}
                        >
                          Dashboard
                        </h2>
                        <p
                          style={{
                            color: "#9ca3af",
                            fontSize: "14px",
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
                        fontSize: "14px",
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
                      gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
                      gap: "16px",
                      marginBottom: "28px",
                    }}
                  >
                    {/* Balance Card */}
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
                          {balanceVisible ? `$${balance.toFixed(2)}` : "••••••"}
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
                            transition: "background 0.2s",
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
                        {/* Connect Wallet — teal outline instead of purple */}
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
                            transition: "all 0.2s",
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

                    {/* Transactions Card */}
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

                  {/* Recent Transactions */}
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

              {/* ── DEPOSIT TAB ── */}
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
                      fontSize: "28px",
                      fontWeight: 800,
                      marginBottom: "12px",
                    }}
                  >
                    Topup
                  </h2>
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "14px",
                      marginBottom: "28px",
                      lineHeight: 1.6,
                    }}
                  >
                    Top your connected wallet with a minimum balance of 5 SOL to
                    activate automatic trading.
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

              {/* ── WITHDRAW TAB ── */}
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
                      fontSize: "24px",
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
                      fontSize: "14px",
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
                          fontSize: "14px",
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
                          fontSize: "14px",
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
                      Withdraw
                    </button>
                  </div>
                </div>
              )}

              {/* ── TRANSACTIONS TAB ── */}
              {activeTab === "transactions" && (
                <div>
                  <h2
                    style={{
                      color: "#fff",
                      fontSize: "24px",
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
                        fontSize: "13px",
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
                        fontSize: "13px",
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
                          <span style={{ color: "#d1d5db", fontSize: "13px" }}>
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

              {/* ── PROFILE TAB ── */}
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
                      fontSize: "24px",
                      fontWeight: 800,
                      textAlign: "center",
                      marginBottom: "6px",
                    }}
                  >
                    Profile
                  </h2>
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "14px",
                      textAlign: "center",
                      marginBottom: "28px",
                    }}
                  >
                    Edit your personal information
                  </p>
                  <div style={{ textAlign: "center", marginBottom: "28px" }}>
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
                        position: "relative",
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
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,0,0,0.45)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: 0,
                          transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.opacity = "1")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.opacity = "0")
                        }
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        background: "#111",
                        border: "1px solid #333",
                        borderRadius: "10px",
                        padding: "10px 16px",
                      }}
                    >
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          padding: "8px 16px",
                          background: "#0d9488",
                          border: "none",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Choose File
                      </button>
                      <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                        {profilePic ? "Image selected ✓" : "No file chosen"}
                      </span>
                    </div>
                  </div>
                  {profileSaved && (
                    <div
                      style={{
                        background: "rgba(13,148,136,0.15)",
                        border: "1px solid rgba(13,148,136,0.35)",
                        borderRadius: "10px",
                        padding: "11px 16px",
                        color: "#2affd0",
                        fontSize: "13px",
                        marginBottom: "16px",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      Profile saved successfully!
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
                      ["firstName", "First Name"],
                      ["lastName", "Last Name"],
                      ["username", "Username"],
                    ].map(([field, ph]) => (
                      <input
                        key={field}
                        type="text"
                        placeholder={ph}
                        value={profileForm[field]}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            [field]: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          background: "#111",
                          border: "1px solid #333",
                          borderRadius: "10px",
                          padding: "13px 16px",
                          color: "#fff",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#0d9488")
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#333")}
                      />
                    ))}
                    <div style={{ position: "relative" }}>
                      <input
                        type="email"
                        value={session.email}
                        readOnly
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          background: "#0d0d0d",
                          border: "1px solid #2a2a2a",
                          borderRadius: "10px",
                          padding: "13px 16px 13px 42px",
                          color: "#6b7280",
                          fontSize: "14px",
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
                          <rect x="3" y="11" width="18" height="11" rx="2" />
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
                    <button
                      onClick={handleProfileSave}
                      style={{
                        padding: "14px",
                        background: "#0d9488",
                        border: "none",
                        borderRadius: "10px",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "15px",
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#0f766e")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#0d9488")
                      }
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>

            
            {/* FOOTER */}
            <footer className="text-center text-gray-500 text-xs py-4 border-t border-[#082626]">
              © {new Date().getFullYear()} OmniDev. All rights reserved.
            </footer>
          </main>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .dash-logout-desktop { display: flex !important; }
          .dash-hamburger { display: none !important; }
          .dash-sidebar { transform: translateX(0) !important; }
          .dash-sidebar-close { display: none !important; }
          .dash-main { margin-left: 232px; }
        }
      `}</style>
    </>
  );
}
