import { useEffect, useRef, useState } from "react";
import main3 from "/src/images/main3.jpg";
import main2 from "/src/images/main2.jpg";

const WORDS = ["Smarter", "Faster", "Safer", "Simpler"];

const PARTNERS = [
  {
    name: "Umbrella",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7" />
      </svg>
    ),
  },
  {
    name: "U-Turn",
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      </svg>
    ),
  },
  {
    name: "Sitemark",
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    name: "Recharge",
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    name: "Nextmove",
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="5 12 19 12" />
        <polyline points="13 6 19 12 13 18" />
      </svg>
    ),
  },
];

const CYCLING_COINS = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    price: "$67,420.00",
    change: "+4.2%",
    up: true,
    logo: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    price: "$3,512.80",
    change: "+2.8%",
    up: true,
    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  {
    name: "Polkadot",
    symbol: "DOT",
    price: "$8.34",
    change: "-1.2%",
    up: false,
    logo: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  },
  {
    name: "Chainlink",
    symbol: "LINK",
    price: "$14.92",
    change: "+5.1%",
    up: true,
    logo: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  },
  {
    name: "Avalanche",
    symbol: "AVAX",
    price: "$38.10",
    change: "+3.7%",
    up: true,
    logo: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  },
  {
    name: "Solana",
    symbol: "SOL",
    price: "$172.55",
    change: "+6.4%",
    up: true,
    logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  },
  {
    name: "Cardano",
    symbol: "ADA",
    price: "$0.4821",
    change: "-0.9%",
    up: false,
    logo: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  },
  {
    name: "Dogecoin",
    symbol: "DOGE",
    price: "$0.1632",
    change: "+1.5%",
    up: true,
    logo: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  },
];

const MARKET_DATA = {
  crypto: [
    {
      name: "Bitcoin",
      symbol: "BTCUSD",
      cap: "$450.245B",
      change: "+1.74%",
      up: true,
      color: "#F7931A",
      icon: "₿",
      path: "M0,30 C10,28 15,20 25,18 C35,16 40,22 50,15 C60,8 65,12 75,8 C85,4 90,10 100,5",
    },
    {
      name: "Ethereum",
      symbol: "ETHUSD",
      cap: "$220.41B",
      change: "+6.25%",
      up: true,
      color: "#627EEA",
      icon: "Ξ",
      path: "M0,28 C8,26 14,30 22,22 C30,14 38,18 48,12 C58,6 65,14 76,9 C87,4 93,8 100,4",
    },
    {
      name: "Tether",
      symbol: "USDT",
      cap: "$66.535B",
      change: "-0.01%",
      up: false,
      color: "#26A17B",
      icon: "₮",
      path: "M0,20 C10,22 18,26 28,24 C38,22 44,28 55,30 C65,32 72,26 82,28 C90,30 95,32 100,34",
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      cap: "$53.974B",
      change: "-3.18%",
      up: false,
      color: "#2775CA",
      icon: "$",
      path: "M0,18 C8,20 16,22 26,26 C36,30 42,28 52,32 C62,36 70,30 80,34 C88,36 94,38 100,40",
    },
    {
      name: "Binance Coin",
      symbol: "BNBUSD",
      cap: "$52.822B",
      change: "+0.83%",
      up: true,
      color: "#F3BA2F",
      icon: "B",
      path: "M0,32 C10,30 16,26 26,24 C36,22 42,18 52,16 C62,14 70,18 80,12 C88,8 94,10 100,8",
    },
    {
      name: "XRP",
      symbol: "XRPUSD",
      cap: "$18.082B",
      change: "+1.73%",
      up: true,
      color: "#00AAE4",
      icon: "✕",
      path: "M0,30 C12,28 18,24 28,20 C38,16 44,20 54,14 C64,8 72,12 82,10 C90,8 95,6 100,4",
    },
  ],
  stocks: [
    {
      name: "Apple",
      symbol: "AAPL",
      cap: "$2.87T",
      change: "+0.54%",
      up: true,
      color: "#A2AAAD",
      icon: "A",
      path: "M0,28 C10,26 18,22 28,20 C38,18 44,22 54,16 C64,10 72,14 82,10 C90,6 95,8 100,5",
    },
    {
      name: "Microsoft",
      symbol: "MSFT",
      cap: "$2.54T",
      change: "+1.20%",
      up: true,
      color: "#00A4EF",
      icon: "M",
      path: "M0,30 C8,28 16,22 26,18 C36,14 42,20 52,14 C62,8 70,12 80,8 C88,4 94,6 100,3",
    },
    {
      name: "Nvidia",
      symbol: "NVDA",
      cap: "$1.22T",
      change: "+3.41%",
      up: true,
      color: "#76B900",
      icon: "N",
      path: "M0,32 C10,28 16,22 26,16 C36,10 44,14 54,8 C64,2 72,6 82,4 C90,2 95,4 100,1",
    },
    {
      name: "Tesla",
      symbol: "TSLA",
      cap: "$564.8B",
      change: "-2.10%",
      up: false,
      color: "#E31937",
      icon: "T",
      path: "M0,18 C10,20 18,24 28,28 C38,32 44,26 54,30 C64,34 72,28 82,32 C90,34 95,36 100,38",
    },
    {
      name: "Amazon",
      symbol: "AMZN",
      cap: "$1.89T",
      change: "+0.87%",
      up: true,
      color: "#FF9900",
      icon: "a",
      path: "M0,28 C10,26 18,24 28,20 C38,16 44,20 54,16 C64,12 72,14 82,10 C90,8 95,6 100,4",
    },
  ],
};

const useCountUp = (target, duration = 1800, triggered = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!triggered) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [triggered, target, duration]);
  return count;
};

const StatItem = ({ value, label, triggered }) => {
  const isK = value.includes("K");
  const isM = value.includes("M");
  const isPercent = value.includes("%");
  const numericTarget = isK ? 7 : isM ? 2 : 0;
  const count = useCountUp(numericTarget, 1800, triggered);
  const display = isPercent
    ? "0%"
    : isK
      ? `${count}K+`
      : isM
        ? `$${count}M+`
        : value;
  return (
    <div className="flex flex-col items-center py-6 px-2">
      <div
        className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-2"
        style={{
          opacity: triggered ? 1 : 0,
          transform: triggered ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        {display}
      </div>
      <div
        className="text-gray-500 text-xs sm:text-base"
        style={{
          opacity: triggered ? 1 : 0,
          transition: "opacity 0.6s ease 0.3s",
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const Home = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [statsTriggered, setStatsTriggered] = useState(false);
  const [featureVisible, setFeatureVisible] = useState(false);
  const [marketVisible, setMarketVisible] = useState(false);
  const [coinIndex, setCoinIndex] = useState(0);
  const [coinVisible, setCoinVisible] = useState(true);
  const [activeTab, setActiveTab] = useState("crypto");

  const statsRef = useRef(null);
  const featureRef = useRef(null);
  const marketRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, 400);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCoinVisible(false);
      setTimeout(() => {
        setCoinIndex((i) => (i + 1) % CYCLING_COINS.length);
        setCoinVisible(true);
      }, 400);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setStatsTriggered(true);
      },
      { threshold: 0.3 },
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setFeatureVisible(true);
      },
      { threshold: 0.2 },
    );
    if (featureRef.current) obs.observe(featureRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setMarketVisible(true);
      },
      { threshold: 0.1 },
    );
    if (marketRef.current) obs.observe(marketRef.current);
    return () => obs.disconnect();
  }, []);

  const STATS = [
    { value: "7K+", label: "Active Users" },
    { value: "0%", label: "Commission Fee" },
    { value: "$2M+", label: "Volume Traded" },
  ];

  const coin = CYCLING_COINS[coinIndex];
  const rows = MARKET_DATA[activeTab];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ════ HERO ════ */}
      <section
        className="relative flex items-center justify-center text-center overflow-hidden px-4"
        style={{ minHeight: "75svh" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${main2})`,
            filter: "brightness(0.35)",
            zIndex: 0,
          }}
        />
        <div className="absolute inset-0 bg-black/45" style={{ zIndex: 1 }} />
        <div
          className="relative w-full max-w-4xl px-4 sm:px-6"
          style={{ zIndex: 2 }}
        >
          <p className="text-[#2affd0] text-xs sm:text-sm font-semibold tracking-widest uppercase mb-4">
            Next-gen crypto platform
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight text-white mb-6">
            Crypto Trading,
            <br />
            <span
              className="text-[#0d9488] inline-block transition-all duration-300"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(-12px)",
              }}
            >
              {WORDS[wordIndex]}
            </span>{" "}
            Than Ever.
          </h1>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Buy, sell and withdraw instantly. Zero commission fees, real-time
            prices, and seamless withdrawals.
          </p>
          <button className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-sm sm:text-base px-10 sm:px-14 py-3.5 sm:py-4 rounded-xl transition-colors duration-200">
            Get Started
          </button>
        </div>
        <button
          className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 rounded-full bg-[#e91e8c] border-none flex items-center justify-center p-3 sm:p-3.5"
          style={{ zIndex: 2 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </section>

      {/* ════ STATS + PARTNERS ════ */}
      <section className="relative bg-[#0a0a0a] py-16 sm:py-20 px-4 sm:px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(13,148,136,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(13,148,136,0.2) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%,transparent 40%,black 100%)",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%,transparent 40%,black 100%)",
            zIndex: 0,
          }}
        />
        <div className="relative" style={{ zIndex: 2 }}>
          <div
            ref={statsRef}
            className="grid grid-cols-3 divide-x divide-[#1a1a1a] max-w-2xl mx-auto mb-16"
          >
            {STATS.map((s) => (
              <StatItem
                key={s.label}
                value={s.value}
                label={s.label}
                triggered={statsTriggered}
              />
            ))}
          </div>
          <p className="text-gray-600 text-sm mb-10 tracking-wide">
            Trusted by dynamic companies around the world
          </p>
          <style>{`
            @keyframes partnerFadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
            .partner-item{opacity:0;animation:partnerFadeIn 0.5s ease forwards}
          `}</style>
          <div className="flex justify-center items-center gap-6 sm:gap-12 flex-wrap max-w-4xl mx-auto">
            {PARTNERS.map((p, i) => (
              <div
                key={p.name}
                className="partner-item flex items-center gap-2 sm:gap-3 text-gray-200 font-extrabold text-base sm:text-xl tracking-wide"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                {p.icon}
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FEATURE ════ */}
      <section
        ref={featureRef}
        className="bg-[#080808] py-16 sm:py-24 px-3 sm:px-12 lg:px-24"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-20">
          <div
            className="flex-1 text-center lg:text-left"
            style={{
              opacity: featureVisible ? 1 : 0,
              transform: featureVisible ? "translateX(0)" : "translateX(-40px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}
          >
            <p className="text-[#0d9488] text-xs font-semibold tracking-widest uppercase mb-4">
              Why choose OmniDev
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
              There's no better time than now to <br />
              <span className="text-[#0d9488]">begin trading.</span>
            </h2>
            <button className="mt-10 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-colors duration-200">
              Start Trading Now
            </button>
          </div>
          <div
            className="flex-1 w-full"
            style={{
              opacity: featureVisible ? 1 : 0,
              transform: featureVisible ? "translateX(0)" : "translateX(40px)",
              transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
            }}
          >
            <div
              className="relative rounded-2xl overflow-hidden border border-[#1a1a1a]"
              style={{ boxShadow: "0 0 60px rgba(13,148,136,0.1)" }}
            >
              <img
                src={main3}
                alt="Trading platform"
                className="w-full object-cover"
                style={{ minHeight: "280px", maxHeight: "480px" }}
              />
              <div
                className="absolute bottom-4 left-4 right-4 bg-black/75 backdrop-blur-sm border border-[#1a1a1a] rounded-xl p-3 sm:p-4 flex items-center justify-between"
                style={{
                  opacity: coinVisible ? 1 : 0,
                  transform: coinVisible ? "translateY(0)" : "translateY(8px)",
                  transition: "opacity 0.35s ease, transform 0.35s ease",
                }}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={coin.logo}
                    alt={coin.symbol}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                    }}
                  />
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">
                      {coin.name} ({coin.symbol})
                    </p>
                    <p className="text-white font-bold text-base sm:text-lg">
                      {coin.price}
                    </p>
                  </div>
                </div>
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border"
                  style={{
                    background: coin.up
                      ? "rgba(13,148,136,0.2)"
                      : "rgba(239,68,68,0.2)",
                    color: coin.up ? "#2affd0" : "#f87171",
                    borderColor: coin.up
                      ? "rgba(13,148,136,0.3)"
                      : "rgba(239,68,68,0.3)",
                  }}
                >
                  {coin.up ? "▲" : "▼"} {coin.change}
                </span>
              </div>
              <div className="absolute top-3 right-3 flex gap-1.5">
                {CYCLING_COINS.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background:
                        i === coinIndex ? "#0d9488" : "rgba(255,255,255,0.2)",
                      transition: "background 0.3s ease",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ MARKET CAP ════ */}
      <section
        ref={marketRef}
        className="relative bg-[#0a0a0a] py-16 sm:py-24 px-4 sm:px-8 lg:px-16 overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(13, 148, 136, 0.1) 2px, transparent 2px), linear-gradient(90deg, rgba(13, 148, 136, 0.1) 2px, transparent 2px)",
            backgroundSize: "80px 80px",
            WebkitMaskImage:
              "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, black 100%)",
            maskImage:
              "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, black 100%)",
            filter:
              "blur(0.5px) drop-shadow(0 0 30px rgba(13, 148, 136, 0.15))",
            zIndex: 0,
          }}
        />
        <style>{`
          @keyframes rowSlideIn { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes drawSpark  { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }
          .mkt-row { opacity: 0; }
          .mkt-row.in { animation: rowSlideIn 0.45s ease forwards; }
          .spark { stroke-dasharray: 300; stroke-dashoffset: 300; }
          .spark.in { animation: drawSpark 1.1s ease forwards; }
        `}</style>

        <div className="relative max-w-5xl mx-auto" style={{ zIndex: 1 }}>
          <div
            style={{
              opacity: marketVisible ? 1 : 0,
              transform: marketVisible ? "translateY(0)" : "translateY(22px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  background: "#111",
                  borderRadius: "999px",
                  padding: "4px",
                }}
              >
                {["crypto", "stocks"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setMarketVisible(false);
                      setTimeout(() => setMarketVisible(true), 10);
                    }}
                    style={{
                      padding: "7px 22px",
                      borderRadius: "999px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "13px",
                      background: activeTab === tab ? "#7c3aed" : "transparent",
                      color: activeTab === tab ? "#fff" : "#6b7280",
                      transition: "background 0.25s, color 0.25s",
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#0d9488";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9ca3af";
                }}
              >
                View All
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-8">
              Market Cap Ranking
            </h2>
          </div>

          <div
            style={{
              background: "#111",
              borderRadius: "18px",
              border: "1px solid #1e1e1e",
              overflow: "hidden",
              opacity: marketVisible ? 1 : 0,
              transform: marketVisible ? "translateY(0)" : "translateY(20px)",
              transition:
                "opacity 0.55s ease 0.15s, transform 0.55s ease 0.15s",
              boxShadow: "0 0 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="hidden sm:grid"
              style={{
                gridTemplateColumns: "1fr 130px 90px 120px",
                padding: "12px 20px",
                borderBottom: "1px solid #1e1e1e",
                color: "#4b5563",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              <span>Name</span>
              <span style={{ textAlign: "right" }}>Market Cap</span>
              <span style={{ textAlign: "right" }}>Change</span>
              <span style={{ textAlign: "right" }}>Chart</span>
            </div>
            {rows.map((row, i) => (
              <div
                key={row.symbol}
                className={`mkt-row ${marketVisible ? "in" : ""}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: "8px",
                  padding: "24px 20px",
                  borderBottom:
                    i < rows.length - 1 ? "1px solid #1a1a1a" : "none",
                  alignItems: "center",
                  animationDelay: `${0.2 + i * 0.09}s`,
                  transition: "background 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: row.color + "20",
                      border: `1.5px solid ${row.color}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: row.color,
                      fontWeight: 800,
                      fontSize: "15px",
                    }}
                  >
                    {row.icon}
                  </div>
                  <div>
                    <p
                      style={{
                        color: "#f3f4f6",
                        fontWeight: 700,
                        fontSize: "14px",
                        margin: 0,
                      }}
                    >
                      {row.name}
                    </p>
                    <p
                      style={{
                        color: "#6b7280",
                        fontSize: "11px",
                        margin: "2px 0 0",
                      }}
                    >
                      {row.symbol}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    color: "#e5e7eb",
                    fontWeight: 600,
                    fontSize: "13px",
                    textAlign: "right",
                    minWidth: "100px",
                  }}
                >
                  {row.cap}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "13px",
                    textAlign: "right",
                    minWidth: "72px",
                    color: row.up ? "#0d9488" : "#ef4444",
                  }}
                >
                  {row.change}
                </span>
                <div
                  style={{
                    minWidth: "100px",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <svg width="100" height="44" viewBox="0 0 100 44" fill="none">
                    <path
                      className={`spark ${marketVisible ? "in" : ""}`}
                      d={row.path}
                      stroke={row.up ? "#0d9488" : "#ef4444"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ animationDelay: `${0.45 + i * 0.1}s` }}
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
