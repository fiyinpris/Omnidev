import { useEffect, useRef, useState } from "react";
import main3 from "/src/images/main3.jpg";
import main2 from "/src/images/main2.jpg";
import traderPhoto from "/src/images/main5.jpg";

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

const ASSET_CARDS = [
  {
    name: "Gemini Dollar",
    symbol: "GMNUSD",
    price: "$9.15",
    change: "+4.64%",
    up: true,
    logo: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="18" fill="#1976D2" opacity="0.15" />
        <circle
          cx="18"
          cy="18"
          r="18"
          stroke="#4FC3F7"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M11 13h14M11 18h14M11 23h14"
          stroke="#4FC3F7"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: "Invitae Corp.",
    symbol: "NVTA",
    price: "$7.68",
    change: "+246.49%",
    up: true,
    logo: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="18" fill="#0d9488" opacity="0.12" />
        <circle
          cx="18"
          cy="18"
          r="18"
          stroke="#26C995"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M18 10 C22 10 26 14 26 18 C26 22 22 26 18 26 C14 26 10 22 10 18 C10 14 14 10 18 10Z"
          stroke="#26C995"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M18 13 C20.5 13 23 15.5 23 18 C23 20.5 20.5 23 18 23 C15.5 23 13 20.5 13 18 C13 15.5 15.5 13 18 13Z"
          stroke="#26C995"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    ),
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

const TRUST_FEATURES = [
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0d9488"
        strokeWidth="1.8"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Bank-Grade Security",
    desc: "Military-level encryption and multi-factor authentication protect every transaction.",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0d9488"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "24/7 Real-Time Data",
    desc: "Live price feeds and instant execution with sub-millisecond latency.",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0d9488"
        strokeWidth="1.8"
      >
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: "Zero Commission",
    desc: "Keep 100% of your profits. No hidden fees, no surprises — ever.",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0d9488"
        strokeWidth="1.8"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "Cross-Platform Access",
    desc: "Trade seamlessly on web, iOS, and Android from any device, anywhere.",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0d9488"
        strokeWidth="1.8"
      >
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
    title: "Advanced Analytics",
    desc: "Professional-grade charting tools and AI-powered insights at your fingertips.",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0d9488"
        strokeWidth="1.8"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Global Community",
    desc: "Join millions of traders worldwide. Share strategies, signals, and success.",
  },
];

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

const AssetSparkLine = ({ up }) => (
  <svg
    width="80"
    height="36"
    viewBox="0 0 110 36"
    fill="none"
    style={{ overflow: "visible" }}
  >
    <path
      d="M0,30 C15,28 25,18 40,14 C55,10 65,16 80,10 C90,6 95,8 110,4"
      stroke={up ? "#26C995" : "#EF4444"}
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      style={{
        strokeDasharray: 300,
        strokeDashoffset: 0,
        animation: "drawAssetLine 1.4s ease forwards",
      }}
    />
  </svg>
);

/* ── Decorative corner bracket ── */
const CornerBracket = ({ side, visible }) => {
  const isLeft = side === "left";
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        [isLeft ? "left" : "right"]: "24px",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: isLeft ? "flex-start" : "flex-end",
        gap: "12px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.8s ease 0.6s",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* Top bracket arm */}
      <svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        fill="none"
        style={{ transform: isLeft ? "none" : "scaleX(-1)" }}
      >
        <path
          d="M50 10 L10 10 L10 50"
          stroke="rgba(13,148,136,0.55)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 100,
            strokeDashoffset: visible ? 0 : 100,
            transition: "stroke-dashoffset 1s ease 0.8s",
          }}
        />
        <circle
          cx="10"
          cy="10"
          r="3"
          fill="#0d9488"
          opacity={visible ? 0.8 : 0}
          style={{ transition: "opacity 0.4s ease 1.6s" }}
        />
      </svg>

      {/* Floating pulse dot */}
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "#0d9488",
          boxShadow:
            "0 0 10px rgba(13,148,136,0.8), 0 0 20px rgba(13,148,136,0.4)",
          animation: visible ? "floatPulse 2.4s ease-in-out infinite" : "none",
          marginLeft: isLeft ? "8px" : 0,
          marginRight: isLeft ? 0 : "8px",
        }}
      />

      {/* Vertical line with tick marks */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          alignItems: isLeft ? "flex-start" : "flex-end",
        }}
      >
        {[1, 0.6, 0.35].map((op, i) => (
          <div
            key={i}
            style={{
              height: "1.5px",
              background: `rgba(13,148,136,${op * 0.5})`,
              borderRadius: "2px",
              width: `${28 - i * 8}px`,
              opacity: visible ? 1 : 0,
              transition: `opacity 0.4s ease ${1 + i * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Bottom bracket arm */}
      <svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        fill="none"
        style={{ transform: isLeft ? "scaleY(-1)" : "scale(-1,-1)" }}
      >
        <path
          d="M50 10 L10 10 L10 50"
          stroke="rgba(13,148,136,0.55)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 100,
            strokeDashoffset: visible ? 0 : 100,
            transition: "stroke-dashoffset 1s ease 1s",
          }}
        />
        <circle
          cx="10"
          cy="50"
          r="3"
          fill="#0d9488"
          opacity={visible ? 0.8 : 0}
          style={{ transition: "opacity 0.4s ease 1.8s" }}
        />
      </svg>
    </div>
  );
};

export const Home = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [statsTriggered, setStatsTriggered] = useState(false);
  const [featureVisible, setFeatureVisible] = useState(false);
  const [tradingVisible, setTradingVisible] = useState(false);
  const [marketVisible, setMarketVisible] = useState(false);
  const [trustVisible, setTrustVisible] = useState(false);
  const [coinIndex, setCoinIndex] = useState(0);
  const [coinVisible, setCoinVisible] = useState(true);
  const [activeTab, setActiveTab] = useState("crypto");
  const [btnHovered, setBtnHovered] = useState(false);

  const statsRef = useRef(null);
  const featureRef = useRef(null);
  const tradingRef = useRef(null);
  const marketRef = useRef(null);
  const trustRef = useRef(null);
  /* ── HIGH-FIDELITY 3D STACKED CIRCUIT CARDS ── */
  const StackedCard3D = () => {
    // Complex circuit pattern generator
    const CircuitBoard = ({ color }) => (
      <svg viewBox="0 0 200 150" className="w-full h-full p-4 opacity-80">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g
          stroke={color}
          strokeWidth="0.8"
          fill="none"
          opacity="0.6"
          filter="url(#glow)"
        >
          {/* Border detail */}
          <rect x="5" y="5" width="190" height="140" rx="12" strokeWidth="2" />
          {/* Intricate lines */}
          <path d="M10 30h40l10-10h60l10 10h60M10 120h40l10 10h60l10-10h60" />
          <path d="M30 10v30M170 10v30M30 140v-30M170 140v-30" />
          <circle cx="30" cy="30" r="3" fill={color} />
          <circle cx="170" cy="30" r="3" fill={color} />
          <circle cx="30" cy="120" r="3" fill={color} />
          <circle cx="170" cy="120" r="3" fill={color} />
          {/* Busy circuit traces */}
          <path d="M60 50h15v20h-15zM125 80h15v20h-15z" strokeWidth="0.5" />
          <path d="M10 75h30M160 75h30M100 10v20M100 120v20" opacity="0.3" />
          <path
            d="M50 40l-10 10v50l10 10h100l10-10v-50l-10-10z"
            strokeWidth="1"
          />
        </g>
      </svg>
    );

    return (
      <div
        className="relative w-[340px] h-[400px] mx-auto"
        style={{ perspective: "1400px" }}
      >
        <div
          className="relative w-full h-full"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(52deg) rotateZ(-32deg)",
          }}
        >
          {/* 1. BOTTOM LAYER: BRONZE */}
          <div
            className="absolute inset-0 bg-[#1a0f0a] rounded-[24px] border-2 border-[#cd7f32]/30 overflow-hidden"
            style={{
              transform: "translateZ(0px)",
              boxShadow: "0 15px 45px rgba(0,0,0,0.9)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#4a2e19]/40 to-transparent" />
            <CircuitBoard color="#cd7f32" />
            <div className="absolute top-8 left-8 w-12 h-10 border border-[#cd7f32]/40 rounded opacity-40" />
          </div>

          {/* 2. MIDDLE LAYER: SILVER (With Arrow) */}
          <div
            className="absolute inset-0 bg-[#0f172a] rounded-[24px] border-2 border-slate-400/40 overflow-hidden"
            style={{
              transform: "translateZ(70px)",
              animation: "floatMid 6s ease-in-out infinite",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 to-transparent" />
            <CircuitBoard color="#94a3b8" />
            {/* Central Arrow Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="2.5"
                filter="url(#glow)"
              >
                <path
                  d="M12 19V5M5 12l7-7 7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="absolute bottom-8 right-8 w-10 h-10 border-2 border-slate-400/30 rounded-full flex items-center justify-center opacity-50">
              <div className="w-4 h-4 bg-slate-400/40 rounded-sm rotate-45" />
            </div>
          </div>

          {/* 3. TOP LAYER: GOLD (With Microchip) */}
          <div
            className="absolute inset-0 bg-[#1a1405] rounded-[24px] border-2 border-yellow-500/50 overflow-hidden"
            style={{
              transform: "translateZ(140px)",
              animation: "floatTop 6s ease-in-out infinite",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent" />
            <CircuitBoard color="#eab308" />

            {/* Central Microchip */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-20 h-20 bg-[#0a0a0a] border border-yellow-500/60 rounded-lg shadow-[0_0_20px_rgba(234,179,8,0.3)] flex items-center justify-center">
                {/* Chip Pins */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-2">
                  {" "}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-1 h-3 bg-yellow-600/60" />
                  ))}{" "}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                  {" "}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-1 h-3 bg-yellow-600/60" />
                  ))}{" "}
                </div>
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                  {" "}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-1 w-3 bg-yellow-600/60" />
                  ))}{" "}
                </div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                  {" "}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-1 w-3 bg-yellow-600/60" />
                  ))}{" "}
                </div>
                {/* Internal Chip Detail */}
                <div className="w-12 h-12 border border-yellow-500/30 rounded flex items-center justify-center">
                  <div className="w-6 h-6 bg-yellow-500/20 blur-sm animate-pulse rounded-full" />
                </div>
              </div>
            </div>

            {/* Corner Detail Icon */}
            <div className="absolute top-8 left-8 w-10 h-10 border border-yellow-500/40 rounded flex items-center justify-center opacity-60">
              <div className="w-6 h-6 border-2 border-yellow-500/40 rounded-sm rotate-45 flex items-center justify-center">
                <div className="w-2 h-2 bg-yellow-500/60 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <style>{`
        @keyframes floatMid { 0%, 100% { transform: translateZ(70px) translateY(0px); } 50% { transform: translateZ(85px) translateY(-10px); } }
        @keyframes floatTop { 0%, 100% { transform: translateZ(140px) translateY(0px); } 50% { transform: translateZ(165px) translateY(-20px); } }
      `}</style>
      </div>
    );
  };

  const rewardsRef = useRef(null);
  const [rewardsVisible, setRewardsVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRewardsVisible(true);
      },
      { threshold: 0.2 },
    );

    if (rewardsRef.current) obs.observe(rewardsRef.current);
    return () => obs.disconnect();
  }, []);

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
        if (e.isIntersecting) setTradingVisible(true);
      },
      { threshold: 0.15 },
    );
    if (tradingRef.current) obs.observe(tradingRef.current);
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

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setTrustVisible(true);
      },
      { threshold: 0.1 },
    );
    if (trustRef.current) obs.observe(trustRef.current);
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
          className="relative w-full max-w-5xl px-4 sm:px-6 lg:px-8"
          style={{ zIndex: 2 }}
        >
          <p className="text-[#2affd0] text-xs sm:text-sm font-semibold tracking-widest uppercase mb-4 mt-10">
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
          <button className="w-full sm:w-auto bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-sm sm:text-base px-10 sm:px-14 py-3.5 sm:py-4 rounded-xl transition-colors duration-200 mb-6">
            Get Started
          </button>
        </div>
        {/* ── Fixed Message Icon ── */}
        <button
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 rounded-full bg-[#e91e8c] border-none flex items-center justify-center p-3 sm:p-3.5 shadow-2xl hover:scale-110 transition-transform cursor-pointer"
          style={{ zIndex: 9999 }} // High z-index ensures it stays above all sections
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
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
              "linear-gradient(rgba(13,148,136,0.24) 2px, transparent 2px), linear-gradient(90deg, rgba(13,148,136,0.24) 2px, transparent 2px)",
            backgroundSize: "80px 80px",
            filter: "blur(0.4px)",
            opacity: 0.98,
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 85% at 50% 50%, transparent 35%, black 100%)",
            maskImage:
              "radial-gradient(ellipse 90% 85% at 50% 50%, transparent 35%, black 100%)",
            zIndex: 0,
          }}
        />
        <div className="relative" style={{ zIndex: 2 }}>
          <div
            ref={statsRef}
            className="grid grid-cols-1 sm:grid-cols-3 divide-y divide-[#1a1a1a] sm:divide-y-0 sm:divide-x rounded-[28px] overflow-hidden border border-[#121212] max-w-2xl mx-auto mb-16"
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
              "linear-gradient(rgba(13,148,136,0.24) 2px, transparent 2px), linear-gradient(90deg, rgba(13,148,136,0.24) 2px, transparent 2px)",
            backgroundSize: "80px 80px",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 85% at 50% 50%, transparent 35%, black 100%)",
            maskImage:
              "radial-gradient(ellipse 90% 85% at 50% 50%, transparent 35%, black 100%)",
            filter: "blur(0.4px) drop-shadow(0 0 30px rgba(13,148,136,0.15))",
            opacity: 0.98,
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
                      background: activeTab === tab ? "#0d9488" : "transparent",
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

      {/* ════ TRADING SIMPLIFIED ════ */}
      <section
        ref={tradingRef}
        style={{
          background: "#0a0a0a" /* ← slightly darker */,
          padding: "50px 24px 38px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,

            background: `
      radial-gradient(circle at 50% 50%, rgba(13,148,136,0.18), transparent 65%),
      radial-gradient(rgba(42,255,208,0.35) 1.2px, transparent 1.2px)
    `,

            backgroundSize: "100% 100%, 50px 50px",

            WebkitMaskImage:
              "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, black 100%)",
            maskImage:
              "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, black 100%)",

            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <style>{`
          @keyframes drawAssetLine  { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }
          @keyframes cardFloat      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
          @keyframes floatPulse     { 0%,100%{transform:translateY(0);opacity:1} 50%{transform:translateY(-8px);opacity:0.6} }
          @keyframes shimmerBtn     { 0%{background-position:200% center} 100%{background-position:-200% center} }
          @keyframes bracketDraw    { from{stroke-dashoffset:100} to{stroke-dashoffset:0} }
          @keyframes orbitDot       { 0%{transform:translateY(0) scale(1);opacity:0.9} 50%{transform:translateY(-18px) scale(1.3);opacity:0.5} 100%{transform:translateY(0) scale(1);opacity:0.9} }
        `}</style>

        {/* ── Floating corner brackets ── */}
        <CornerBracket side="left" visible={tradingVisible} />
        <CornerBracket side="right" visible={tradingVisible} />

        {/* extra ambient glow left/right */}
        <div
          style={{
            position: "absolute",
            left: "-80px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-80px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "60px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "28px",
              flexWrap: "wrap",
              width: "100%",
            }}
          >
            {/* person image + market overview card */}
            <div
              style={{
                position: "relative",
                flex: "0 0 auto",
                opacity: tradingVisible ? 1 : 0,
                transform: tradingVisible
                  ? "translateY(0)"
                  : "translateY(24px)",
                transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
              }}
            >
              <div
                style={{
                  width: "400px",
                  height: "430px",
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "#111820",
                  boxShadow: "0 0 50px rgba(13,148,136,0.12)",
                }}
              >
                {traderPhoto ? (
                  <img
                    src={traderPhoto}
                    alt="Trader"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                      color: "rgba(255,255,255,0.15)",
                    }}
                  >
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <circle cx="12" cy="7" r="4" />
                      <path d="M4 20 C4 16 8 13 12 13 C16 13 20 16 20 20" />
                    </svg>
                    <span style={{ fontSize: "12px", letterSpacing: "0.1em" }}>
                      y
                    </span>
                  </div>
                )}
              </div>

              {/* market overview overlay card */}
              <div
                style={{
                  position: "absolute",
                  bottom: "-40px",
                  left: "-110px",
                  animation: tradingVisible
                    ? "cardFloat 4s ease-in-out 1s infinite"
                    : "none",
                  opacity: tradingVisible ? 1 : 0,
                  transform: tradingVisible
                    ? "translateY(0)"
                    : "translateY(14px)",
                  transition:
                    "opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s",
                }}
              >
                <div
                  style={{
                    background: "rgba(10,14,20,0.88)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "14px",
                    padding: "14px 18px",
                    width: "200px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        color: "#9ca3af",
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                      }}
                    >
                      Market Overview
                    </span>
                    <span style={{ color: "#6b7280", fontSize: "10px" }}>
                      Last 30 days ▾
                    </span>
                  </div>
                  <svg
                    width="160"
                    height="50"
                    viewBox="0 0 160 50"
                    fill="none"
                    style={{ display: "block", marginBottom: "10px" }}
                  >
                    <defs>
                      <linearGradient
                        id="chartGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#0d9488"
                          stopOpacity="0.35"
                        />
                        <stop
                          offset="100%"
                          stopColor="#0d9488"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,42 C15,38 25,30 45,22 C65,14 75,28 95,20 C115,12 130,16 160,8 L160,50 L0,50Z"
                      fill="url(#chartGrad)"
                    />
                    <path
                      d="M0,42 C15,38 25,30 45,22 C65,14 75,28 95,20 C115,12 130,16 160,8"
                      stroke="#0d9488"
                      strokeWidth="1.8"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <circle cx="160" cy="8" r="3.5" fill="#0d9488" />
                  </svg>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: "rgba(13,148,136,0.18)",
                      border: "1px solid rgba(13,148,136,0.3)",
                      borderRadius: "8px",
                      padding: "4px 10px",
                    }}
                  >
                    <span
                      style={{
                        color: "#2affd0",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      ▲ +32.6%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* asset cards */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                paddingLeft: "20px",
              }}
            >
              {ASSET_CARDS.map((card, i) => (
                <div
                  key={card.symbol}
                  style={{
                    background: "rgba(10,14,20,0.75)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    padding: "16px 22px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    minWidth: "340px",
                    opacity: tradingVisible ? 1 : 0,
                    transform: tradingVisible
                      ? "translateX(0)"
                      : "translateX(30px)",
                    transition: `opacity 0.6s ease ${0.25 + i * 0.15}s, transform 0.6s ease ${0.25 + i * 0.15}s`,
                    animation: tradingVisible
                      ? `cardFloat ${4.5 + i * 0.7}s ease-in-out ${1.5 + i * 0.4}s infinite`
                      : "none",
                    boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
                  }}
                >
                  <div style={{ flexShrink: 0 }}>{card.logo}</div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        color: "#f3f4f6",
                        fontWeight: 700,
                        fontSize: "15px",
                        margin: "0 0 2px",
                      }}
                    >
                      {card.name}
                    </p>
                    <p
                      style={{ color: "#6b7280", fontSize: "12px", margin: 0 }}
                    >
                      {card.symbol}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", marginRight: "12px" }}>
                    <p
                      style={{
                        color: "#f9fafb",
                        fontWeight: 700,
                        fontSize: "16px",
                        margin: "0 0 2px",
                      }}
                    >
                      {card.price}
                    </p>
                    <p
                      style={{
                        color: card.up ? "#2affd0" : "#f87171",
                        fontSize: "12px",
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      {card.up ? "▲" : "▼"} {card.change}
                    </p>
                  </div>
                  <AssetSparkLine up={card.up} />
                </div>
              ))}
            </div>
          </div>

          {/* heading + CTA */}
          <div
            style={{
              textAlign: "center",
              maxWidth: "620px",
              opacity: tradingVisible ? 1 : 0,
              transform: tradingVisible ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s",
            }}
          >
            <h2
              style={{
                color: "#ffffff",
                fontSize: "clamp(2rem, 5vw, 3.2rem)",
                fontWeight: 800,
                lineHeight: 1.15,
                margin: "0 0 16px",
                letterSpacing: "-0.02em",
              }}
            >
              Trading simplified.
              <br />A world of opportunity,{" "}
              <span style={{ color: "#0d9488" }}>within reach.</span>
            </h2>
            <p
              style={{
                color: "#9ca3af",
                fontSize: "15px",
                lineHeight: 1.7,
                margin: "0 0 36px",
              }}
            >
              Whether you're just getting started or you're an expert, our
              platform is designed for everyone.
            </p>

            {/* ── Animated shimmer Get Started button ── */}
            <button
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                position: "relative",
                overflow: "hidden",
                background: btnHovered
                  ? "linear-gradient(270deg, #0f766e, #0d9488, #2affd0, #0d9488, #0f766e)"
                  : "#0d9488",
                backgroundSize: "400% 100%",
                animation: btnHovered
                  ? "shimmerBtn 2s linear infinite"
                  : "none",
                color: "#fff",
                fontWeight: 700,
                fontSize: "15px",
                padding: "14px 36px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.2s",
                transform: btnHovered ? "scale(1.04)" : "scale(1)",
                boxShadow: btnHovered
                  ? "0 0 28px rgba(13,148,136,0.55), 0 0 60px rgba(42,255,208,0.2)"
                  : "0 0 0 rgba(0,0,0,0)",
              }}
            >
              {/* sweeping glint overlay */}
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
                  backgroundSize: "200% 100%",
                  animation: btnHovered
                    ? "shimmerBtn 1.2s linear infinite"
                    : "none",
                  borderRadius: "inherit",
                  pointerEvents: "none",
                }}
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
              <span style={{ position: "relative" }}>Get Started</span>
            </button>
          </div>
        </div>
      </section>

      {/* ════ TRUSTED PLATFORM ════ */}
      <section
        ref={trustRef}
        style={{
          position: "relative",
          background: "#060608",
          padding: "100px 24px 110px",
          overflow: "hidden",
        }}
      >
        {/* ── blurred-edge grid (same treatment as market cap) ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(13,148,136,0.24) 2px, transparent 2px), linear-gradient(90deg, rgba(13,148,136,0.24) 2px, transparent 2px)",
            backgroundSize: "80px 80px",
            /* blur the grid itself, then mask edges to transparent */
            filter: "blur(0.4px)",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 85% at 50% 50%, transparent 35%, black 100%)",
            maskImage:
              "radial-gradient(ellipse 90% 85% at 50% 50%, transparent 35%, black 100%)",
            pointerEvents: "none",
            zIndex: 0,
            opacity: 0.98,
          }}
        />

        {/* subtle teal glow behind heading */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "300px",
            background:
              "radial-gradient(ellipse, rgba(13,148,136,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <style>{`
          @keyframes trustFadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
          @keyframes cardGlow    { 0%,100%{ box-shadow:0 0 0 rgba(13,148,136,0) } 50%{ box-shadow:0 0 22px rgba(13,148,136,0.15) } }
          .trust-card { opacity:0; }
          .trust-card.in { animation: trustFadeUp 0.55s ease forwards; }
        `}</style>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "900px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          {/* heading */}
          <div
            style={{
              opacity: trustVisible ? 1 : 0,
              transform: trustVisible ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}
          >
            <p
              style={{
                color: "#0d9488",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              Why traders choose us
            </p>
            <h2
              style={{
                color: "#ffffff",
                fontSize: "clamp(2rem, 5vw, 3.6rem)",
                fontWeight: 900,
                lineHeight: 1.12,
                letterSpacing: "-0.025em",
                margin: "0 auto 20px",
                maxWidth: "780px",
              }}
            >
              The most trusted cryptocurrency trading and arbitrage platform
            </h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: "16px",
                lineHeight: 1.75,
                maxWidth: "560px",
                margin: "0 auto 72px",
              }}
            >
              Traders who rely on us for unlocking lucrative arbitrage
              opportunities safely and securely.
            </p>
          </div>
        </div>
      </section>
      {/* ════ REWARDS PROGRAM ════ */}
      <section
        ref={rewardsRef}
        className="relative bg-[#020609] py-24 px-6 overflow-hidden flex items-center min-h-[75vh]"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0d9488] opacity-5 blur-[160px]" />

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center z-10">
          {/* Left */}
          <div
            style={{
              opacity: rewardsVisible ? 1 : 0,
              transform: rewardsVisible ? "translateX(0)" : "translateX(-40px)",
              transition: "all 1s ease",
            }}
          >
            <StackedCard3D />
          </div>

          {/* Right */}
          <div
            style={{
              opacity: rewardsVisible ? 1 : 0,
              transform: rewardsVisible ? "translateY(0)" : "translateY(30px)",
              transition: "all 1s ease 0.3s",
            }}
            className="text-center md:text-left"
          >
            <span className="text-[#0d9488] text-xs font-bold tracking-[0.4em] uppercase mb-6 block">
              Rewards Program
            </span>

            <h2 className="text-4xl md:text-6xl font-black text-white mb-8">
              Earn weekly rewards <br />
              <span className="bg-gradient-to-r from-[#2affd0] to-[#86efac] bg-clip-text text-transparent">
                as you trade
              </span>
            </h2>

            <p className="text-gray-400 mb-10 max-w-lg">
              Earn consistent rewards as you trade and grow your portfolio over
              time.
            </p>

            <button className="border-2 border-[#0d9488]/40 hover:border-[#0d9488] px-10 py-4 rounded-xl text-white transition">
              Get Started
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
