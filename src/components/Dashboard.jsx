import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "/src/images/omnidev logo.png";

// ── Sidebar nav items ──
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

// ── Ticker data (same as TickerBar.jsx) ──
const TICKERS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: "67,423.18",
    change: "+2.14%",
    up: true,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: "3,512.44",
    change: "+1.87%",
    up: true,
  },
  { symbol: "BNB", name: "BNB", price: "632.88", change: "-0.11%", up: false },
  { symbol: "SOL", name: "Solana", price: "87.05", change: "+0.01%", up: true },
  {
    symbol: "DOT",
    name: "Polkadot",
    price: "1.37",
    change: "+0.02%",
    up: true,
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    price: "9.01",
    change: "+0.02%",
    up: true,
  },
  { symbol: "TRX", name: "TRON", price: "0.12", change: "-0.34%", up: false },
  { symbol: "ADA", name: "Cardano", price: "0.45", change: "+1.20%", up: true },
];

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [tickerOffset, setTickerOffset] = useState(0);
  const navigate = useNavigate();

  // Auth check
  useEffect(() => {
    const s = localStorage.getItem("omnidev_session");
    if (!s || !JSON.parse(s).loggedIn) {
      navigate("/login");
      return;
    }
    setSession(JSON.parse(s));
  }, [navigate]);

  // Animate ticker
  useEffect(() => {
    const id = setInterval(() => {
      setTickerOffset((prev) => {
        const tickerWidth = TICKERS.length * 220;
        return prev <= -tickerWidth ? 0 : prev - 1;
      });
    }, 20);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("omnidev_session");
    navigate("/");
  };

  if (!session) return null;

  const firstName =
    session.firstName || session.username || session.email.split("@")[0];
  const account = (() => {
    const accounts = JSON.parse(
      localStorage.getItem("omnidev_accounts") || "{}",
    );
    return accounts[session.email] || {};
  })();
  const balance = account.balance || 0;
  const transactions = account.transactions || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {/* ════════════════════════════════════════
          STICKY HEADER: Navbar + TickerBar
          ════════════════════════════════════════ */}
      <div className="sticky top-0 z-50 flex-shrink-0">
        {/* NAVBAR */}
        <header className="h-14 bg-[#0d9488] flex items-center justify-between px-4 md:px-6">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="OmniDev"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-white font-bold text-lg tracking-wide">
              OmniDev
            </span>
          </div>

          {/* Right side: Logout (desktop) / Hamburger (mobile) */}
          <div className="flex items-center gap-3">
            {/* Desktop: Logout */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all border border-white/20"
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

            {/* Mobile: Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden flex flex-col gap-[5px] p-2 bg-white/10 rounded-lg"
            >
              <span className="w-5 h-[2px] bg-white rounded-full block"></span>
              <span className="w-5 h-[2px] bg-white rounded-full block"></span>
              <span className="w-3 h-[2px] bg-white/70 rounded-full block"></span>
            </button>
          </div>
        </header>

        {/* TICKER BAR — directly under navbar */}
        <div className="h-10 bg-[#111] border-b border-[#222] flex items-center overflow-hidden">
          <div
            className="flex whitespace-nowrap"
            style={{
              transform: `translateX(${tickerOffset}px)`,
              transition: "none",
            }}
          >
            {[...TICKERS, ...TICKERS, ...TICKERS].map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-6 text-xs font-medium"
              >
                <span className="text-gray-400">
                  {t.name} ({t.symbol})
                </span>
                <span className="text-white">${t.price}</span>
                <span className={t.up ? "text-emerald-400" : "text-red-400"}>
                  {t.up ? "▲" : "▼"} {t.change}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MAIN: Sidebar + Content
          ════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 z-40 md:hidden"
          />
        )}

        {/* SIDEBAR — Fixed on desktop */}
        <aside
          className={`
            w-60 bg-[#0f0f13] border-r border-[#1a1a2e] flex flex-col flex-shrink-0
            fixed top-[calc(56px+40px)] left-0 h-[calc(100vh-56px-40px)] z-50
            transition-transform duration-300 ease-in-out
            overflow-y-auto overflow-x-hidden
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* Mobile: Sidebar header */}
          <div className="p-5 pb-4 border-b border-[#1a1a2e] md:hidden">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="OmniDev"
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-[#0d9488] font-bold text-lg">OmniDev</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 py-3">
            {SIDEBAR_ITEMS.map((item) => {
              const active = activeTab === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setActiveTab(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-5 py-3 text-left text-sm font-medium transition-all rounded-lg mx-2
                    ${
                      active
                        ? "bg-[#0d9488] text-white"
                        : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Mobile: Logout */}
          <div className="p-4 border-t border-[#1a1a2e] md:hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 justify-center px-4 py-2.5 bg-transparent border border-gray-600 text-gray-400 hover:text-red-400 hover:border-red-400 rounded-lg text-sm font-semibold transition-all"
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

        {/* MAIN CONTENT — Scrollable, offset by sidebar width on desktop */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a] md:ml-60">
          <div className="p-6 max-w-6xl mx-auto min-h-[calc(100vh-56px-40px-80px)]">
            {/* ════════════════════════════════════════
                DASHBOARD TAB
                ════════════════════════════════════════ */}
            {activeTab === "dashboard" && (
              <div>
                {/* Welcome */}
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0d9488] to-[#065f46] flex items-center justify-center border-2 border-[#0d9488]">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                      >
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                      </svg>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                      Dashboard
                    </h2>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Hi <strong className="text-white">{firstName}</strong>!
                    <br />
                    Topup your account or connect your wallet to start trading.
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* Balance Card */}
                  <div className="bg-[#111] rounded-2xl p-6 border border-[#222]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#0d9488] flex items-center justify-center">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="16" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs mb-1">USD Balance</p>
                    <div className="flex items-center gap-2 mb-4">
                      <p className="text-white text-3xl font-bold">
                        {balanceVisible ? `$${balance.toFixed(2)}` : "••••••"}
                      </p>
                      <button
                        onClick={() => setBalanceVisible(!balanceVisible)}
                        className="text-gray-500 hover:text-white"
                      >
                        {balanceVisible ? (
                          <svg
                            width="18"
                            height="18"
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
                            width="18"
                            height="18"
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
                    <button
                      onClick={() => setActiveTab("deposit")}
                      className="w-full py-3 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm transition-colors mb-3"
                    >
                      Deposit
                    </button>
                    <button className="w-full py-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-sm transition-colors">
                      Connect Wallet
                    </button>
                  </div>

                  {/* Transactions Card */}
                  <div className="bg-[#111] rounded-2xl p-6 border border-[#222]">
                    <div className="mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#0d9488] flex items-center justify-center">
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
                    </div>
                    <p className="text-gray-500 text-xs mb-1">
                      Total Transactions
                    </p>
                    <p className="text-white text-3xl font-bold">
                      {transactions.length}
                    </p>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-base">
                      Recent Transactions
                    </h3>
                    <button
                      onClick={() => setActiveTab("transactions")}
                      className="text-xs bg-[#1a1a1a] hover:bg-[#222] text-gray-400 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      View All
                    </button>
                  </div>
                  <div className="bg-[#0d9488] rounded-t-xl px-5 py-3">
                    <div className="grid grid-cols-3 text-white text-xs font-semibold">
                      <span>VSN</span>
                      <span className="text-center">Type</span>
                      <span className="text-right">Amount</span>
                    </div>
                  </div>
                  <div className="bg-[#111] rounded-b-xl border border-t-0 border-[#222] p-8 text-center">
                    <p className="text-gray-500 text-sm">
                      No recent transactions
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════
                DEPOSIT USD TAB (Topup)
                ════════════════════════════════════════ */}
            {activeTab === "deposit" && (
              <div className="max-w-md mx-auto text-center pt-8">
                <h2 className="text-3xl font-bold text-white mb-3">Topup</h2>
                <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
                  Top your connected wallet with a minimum balance of 5 SOL to
                  activate automatic trading.
                </p>
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold rounded-xl transition-colors">
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

            {/* ════════════════════════════════════════
                WITHDRAW USD TAB
                ════════════════════════════════════════ */}
            {activeTab === "withdraw" && (
              <div className="max-w-md mx-auto pt-4">
                <h2 className="text-2xl font-bold text-white text-center mb-2">
                  Withdraw USD
                </h2>
                <p className="text-gray-400 text-sm text-center mb-8">
                  Withdraw your USD into your bank account or preferred payment
                  method
                </p>

                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-400 text-sm">Amount</label>
                      <span className="text-[#0d9488] text-xs bg-[#0d9488]/10 px-2 py-0.5 rounded">
                        Max
                      </span>
                    </div>
                    <input
                      type="number"
                      placeholder="Enter USD Amount"
                      className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#0d9488] placeholder-gray-600"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      Payment Details
                    </label>
                    <textarea
                      placeholder="Enter Your Payment Details"
                      rows={4}
                      className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#0d9488] placeholder-gray-600 resize-none"
                    />
                  </div>

                  <button className="w-full py-3.5 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-colors">
                    Withdraw
                  </button>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════
                TRANSACTIONS TAB
                ════════════════════════════════════════ */}
            {activeTab === "transactions" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Transactions
                </h2>

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    className="flex-1 bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#0d9488] placeholder-gray-600"
                  />
                  <div className="flex gap-3">
                    <select className="bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#0d9488]">
                      <option>All Types</option>
                      <option>Deposit</option>
                      <option>Withdrawal</option>
                    </select>
                    <button className="px-5 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-sm font-semibold rounded-xl transition-colors">
                      Export
                    </button>
                  </div>
                </div>

                <div className="bg-[#0d9488] rounded-t-xl px-5 py-3">
                  <div className="grid grid-cols-3 text-white text-xs font-semibold">
                    <span>VSN</span>
                    <span className="text-center">Type</span>
                    <span className="text-right">Amount</span>
                  </div>
                </div>

                <div className="bg-[#111] rounded-b-xl border border-t-0 border-[#222]">
                  {transactions.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#444"
                          strokeWidth="2"
                        >
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">
                        No transactions found
                      </p>
                    </div>
                  ) : (
                    transactions.map((t, i) => (
                      <div
                        key={i}
                        className={`grid grid-cols-3 px-5 py-4 ${i < transactions.length - 1 ? "border-b border-[#222]" : ""}`}
                      >
                        <span className="text-gray-300 text-sm">
                          {t.vsn || "-"}
                        </span>
                        <span className="text-gray-300 text-sm text-center">
                          {t.type}
                        </span>
                        <span className="text-[#0d9488] text-sm font-bold text-right">
                          ${t.amount}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════
                PROFILE TAB
                ════════════════════════════════════════ */}
            {activeTab === "profile" && (
              <div className="max-w-md mx-auto pt-4 text-center">
                <h2 className="text-2xl font-bold text-white mb-1">Profile</h2>
                <p className="text-gray-400 text-sm mb-8">
                  Edit your personal information
                </p>

                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#0d9488] flex items-center justify-center mb-3">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
                    Update Profile Picture
                  </p>

                  <div className="flex items-center justify-center gap-3 bg-[#111] border border-[#333] rounded-xl px-4 py-3 mb-8">
                    <label className="px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white text-sm font-medium rounded-lg cursor-pointer transition-colors">
                      Choose File
                      <input type="file" className="hidden" accept="image/*" />
                    </label>
                    <span className="text-gray-400 text-sm">
                      No file chosen
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <input
                    type="text"
                    placeholder="First Name"
                    defaultValue={session.firstName || ""}
                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#0d9488] placeholder-gray-600"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    defaultValue={session.lastName || ""}
                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#0d9488] placeholder-gray-600"
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    defaultValue={session.username || ""}
                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#0d9488] placeholder-gray-600"
                  />
                  <input
                    type="email"
                    placeholder="Example@gmail.com"
                    defaultValue={session.email || ""}
                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#0d9488] placeholder-gray-600"
                  />

                  <button className="w-full py-3.5 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-colors mt-2">
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Copyright */}
          <div className="border-t border-[#1a1a2e] py-4 mt-auto">
            <p className="text-[#0d9488]/60 text-[11px] text-center">
              © {new Date().getFullYear()} Omnidev Exchange Inc. All Rights
              Reserved.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
