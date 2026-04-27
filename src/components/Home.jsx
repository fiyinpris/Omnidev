import { useEffect, useRef, useState } from "react";
import main3 from "/src/images/main3.jpg";
import main2 from "/src/images/main2.jpg";
import traderPhoto from "/src/images/main7.jpg";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const WORDS = ["Smarter", "Faster", "Safer", "Simpler"];

const CYCLING_COINS = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    geckoId: "bitcoin",
    change: "+4.2%",
    up: true,
    logo: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    geckoId: "ethereum",
    change: "+2.8%",
    up: true,
    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  {
    name: "Polkadot",
    symbol: "DOT",
    geckoId: "polkadot",
    change: "-1.2%",
    up: false,
    logo: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  },
  {
    name: "Chainlink",
    symbol: "LINK",
    geckoId: "chainlink",
    change: "+5.1%",
    up: true,
    logo: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  },
  {
    name: "Avalanche",
    symbol: "AVAX",
    geckoId: "avalanche-2",
    change: "+3.7%",
    up: true,
    logo: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  },
  {
    name: "Solana",
    symbol: "SOL",
    geckoId: "solana",
    change: "+6.4%",
    up: true,
    logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  },
  {
    name: "Cardano",
    symbol: "ADA",
    geckoId: "cardano",
    change: "-0.9%",
    up: false,
    logo: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  },
  {
    name: "Dogecoin",
    symbol: "DOGE",
    geckoId: "dogecoin",
    change: "+1.5%",
    up: true,
    logo: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  },
];

const ASSET_CARDS = [
  {
    name: "Gemini Dollar",
    symbol: "GMINUSD",
    price: "$9.15",
    change: "+4.64%",
    up: true,
    domain: "gemini.com",
  },
  {
    name: "Invitae Corp.",
    symbol: "NVTA",
    price: "$7.68",
    change: "+246.49%",
    up: true,
    domain: "invitae.com",
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
  const isK = value.includes("K"),
    isM = value.includes("M"),
    isPercent = value.includes("%");
  const count = useCountUp(isK ? 7 : isM ? 2 : 0, 1800, triggered);
  const display = isPercent
    ? "0%"
    : isK
      ? `${count}K+`
      : isM
        ? `$${count}M+`
        : value;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 8px",
      }}
    >
      <div
        style={{
          fontSize: "clamp(28px,6vw,52px)",
          fontWeight: 900,
          color: "#fff",
          marginBottom: "6px",
          opacity: triggered ? 1 : 0,
          transform: triggered ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        {display}
      </div>
      <div
        style={{
          color: "#6b7280",
          fontSize: "clamp(11px,1.5vw,14px)",
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
    width="72"
    height="32"
    viewBox="0 0 110 36"
    fill="none"
    style={{ overflow: "visible", flexShrink: 0 }}
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

const CornerBracket = ({ side, visible }) => {
  const isLeft = side === "left";
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        [isLeft ? "left" : "right"]: "16px",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: isLeft ? "flex-start" : "flex-end",
        gap: "10px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.8s ease 0.6s",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg
        width="50"
        height="50"
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
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "#0d9488",
          boxShadow: "0 0 10px rgba(13,148,136,0.8)",
          animation: visible ? "floatPulse 2.4s ease-in-out infinite" : "none",
          marginLeft: isLeft ? "6px" : 0,
          marginRight: isLeft ? 0 : "6px",
        }}
      />
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
      <svg
        width="50"
        height="50"
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

const StackedCards3D = ({ visible }) => (
  <div
    style={{
      position: "relative",
      width: "100%",
      maxWidth: "340px",
      height: "320px",
      margin: "0 auto",
      perspective: "1100px",
      perspectiveOrigin: "50% 28%",
    }}
  >
    <style>{`
      @keyframes floatG { 0%,100%{transform:rotateX(48deg) rotateZ(-26deg) translateZ(110px) translateY(0)} 50%{transform:rotateX(48deg) rotateZ(-26deg) translateZ(110px) translateY(-14px)} }
      @keyframes floatS { 0%,100%{transform:rotateX(48deg) rotateZ(-26deg) translateZ(48px) translateY(0)} 50%{transform:rotateX(48deg) rotateZ(-26deg) translateZ(48px) translateY(-9px)} }
      @keyframes floatB { 0%,100%{transform:rotateX(48deg) rotateZ(-26deg) translateZ(-8px) translateY(0)} 50%{transform:rotateX(48deg) rotateZ(-26deg) translateZ(-8px) translateY(-5px)} }
      @keyframes gGlow  { 0%,100%{opacity:.65;transform:translateX(-50%) scaleX(1)} 50%{opacity:1;transform:translateX(-50%) scaleX(1.28)} }
    `}</style>
    <div
      style={{
        position: "absolute",
        bottom: "2px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "200px",
        height: "24px",
        borderRadius: "50%",
        background:
          "radial-gradient(ellipse, rgba(210,90,10,0.35) 0%, transparent 80%)",
        filter: "blur(8px)",
        animation: visible ? "gGlow 3s ease-in-out infinite" : "none",
        zIndex: 0,
      }}
    />
    {/* BRONZE */}
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: "-72px",
        marginLeft: "-115px",
        width: "240px",
        height: "148px",
        borderRadius: "14px",
        background:
          "linear-gradient(145deg,#3c1604 0%,#9c5020 18%,#c86c38 34%,#783010 50%,#b85c2c 64%,#4c1c06 80%,#a04818 100%)",
        border: "1.5px solid rgba(192,100,44,0.55)",
        boxShadow: "0 0 14px rgba(180,70,10,0.25)",
        animation: visible ? "floatB 6.5s ease-in-out 0.8s infinite" : "none",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      <svg
        width="240"
        height="148"
        viewBox="0 0 240 148"
        fill="none"
        style={{ position: "absolute", inset: 0 }}
      >
        <polyline
          points="16,34 50,34 50,88 30,88"
          stroke="rgba(80,32,8,.55)"
          strokeWidth="1.1"
          fill="none"
        />
        <circle cx="50" cy="34" r="2.3" fill="rgba(75,28,6,.6)" />
        <circle cx="50" cy="88" r="2.3" fill="rgba(75,28,6,.55)" />
        <line
          x1="165"
          y1="28"
          x2="222"
          y2="28"
          stroke="rgba(75,28,6,.38)"
          strokeWidth="1"
        />
        <line
          x1="165"
          y1="54"
          x2="222"
          y2="54"
          stroke="rgba(75,28,6,.32)"
          strokeWidth="1"
        />
        <line
          x1="165"
          y1="28"
          x2="165"
          y2="54"
          stroke="rgba(75,28,6,.35)"
          strokeWidth="1"
        />
        <g transform="translate(200,106)">
          <line
            x1="0"
            y1="-11"
            x2="0"
            y2="11"
            stroke="rgba(88,36,8,.68)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="-9.5"
            y1="-5.5"
            x2="9.5"
            y2="5.5"
            stroke="rgba(88,36,8,.68)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="9.5"
            y1="-5.5"
            x2="-9.5"
            y2="5.5"
            stroke="rgba(88,36,8,.68)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle
            cx="0"
            cy="0"
            r="3.5"
            fill="rgba(70,28,6,.4)"
            stroke="rgba(155,72,18,.5)"
            strokeWidth="1.1"
          />
        </g>
        <g transform="translate(34,106)">
          <circle
            cx="0"
            cy="0"
            r="13"
            fill="rgba(65,26,5,.36)"
            stroke="rgba(148,66,15,.5)"
            strokeWidth="1.4"
          />
          <line
            x1="-5.5"
            y1="0"
            x2="5.5"
            y2="0"
            stroke="rgba(182,90,22,.86)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <polyline
            points="1.5,-4.5 7.5,0 1.5,4.5"
            fill="none"
            stroke="rgba(182,90,22,.86)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <linearGradient id="bsh" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="28%" stopColor="rgba(255,150,65,.05)" />
            <stop offset="44%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="240" height="148" rx="14" fill="url(#bsh)" />
      </svg>
    </div>
    {/* SILVER */}
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: "-86px",
        marginLeft: "-105px",
        width: "240px",
        height: "148px",
        borderRadius: "14px",
        background:
          "linear-gradient(145deg,#0c1628 0%,#1a2d4a 18%,#2a4060 34%,#152238 50%,#1e3258 64%,#0a1422 80%,#182a48 100%)",
        border: "1.5px solid rgba(80,130,200,0.42)",
        animation: visible ? "floatS 5.8s ease-in-out 0.4s infinite" : "none",
        overflow: "hidden",
        zIndex: 2,
      }}
    >
      <svg
        width="240"
        height="148"
        viewBox="0 0 240 148"
        fill="none"
        style={{ position: "absolute", inset: 0 }}
      >
        <polyline
          points="16,36 50,36 50,82"
          stroke="rgba(60,100,180,.42)"
          strokeWidth="1.1"
          fill="none"
        />
        <circle cx="50" cy="36" r="2.2" fill="rgba(55,90,170,.48)" />
        <line
          x1="170"
          y1="28"
          x2="222"
          y2="28"
          stroke="rgba(55,90,170,.32)"
          strokeWidth="1"
        />
        <g transform="translate(66,82)">
          <circle
            cx="0"
            cy="0"
            r="24"
            fill="rgba(40,70,140,.36)"
            stroke="rgba(80,140,220,.48)"
            strokeWidth="1.8"
          />
          <line
            x1="-11"
            y1="0"
            x2="11"
            y2="0"
            stroke="rgba(140,190,255,.9)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <polyline
            points="3.5,-7.5 12.5,0 3.5,7.5"
            fill="none"
            stroke="rgba(140,190,255,.9)"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g transform="translate(194,82)">
          <line
            x1="0"
            y1="-15"
            x2="0"
            y2="15"
            stroke="rgba(60,100,180,.58)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="-13"
            y1="-7.5"
            x2="13"
            y2="7.5"
            stroke="rgba(60,100,180,.58)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="13"
            y1="-7.5"
            x2="-13"
            y2="7.5"
            stroke="rgba(60,100,180,.58)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle
            cx="0"
            cy="0"
            r="4.5"
            fill="rgba(50,85,160,.33)"
            stroke="rgba(90,145,220,.46)"
            strokeWidth="1.3"
          />
        </g>
        <circle cx="218" cy="136" r="4.5" fill="#0db894" opacity="0.88" />
        <circle cx="218" cy="136" r="7.5" fill="rgba(13,184,148,0.18)" />
        <defs>
          <linearGradient id="svsh" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="30%" stopColor="rgba(100,160,255,.05)" />
            <stop offset="46%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="240" height="148" rx="14" fill="url(#svsh)" />
      </svg>
    </div>
    {/* GOLD */}
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: "-100px",
        marginLeft: "-95px",
        width: "240px",
        height: "148px",
        borderRadius: "14px",
        background:
          "linear-gradient(145deg,#5a3a00 0%,#b57a0c 12%,#e0b83a 28%,#a86e08 44%,#d8a828 60%,#8e5e06 76%,#b88312 100%)",
        border: "1.5px solid rgba(255,218,60,0.65)",
        animation: visible ? "floatG 5.2s ease-in-out 0s infinite" : "none",
        overflow: "hidden",
        zIndex: 3,
      }}
    >
      <svg
        width="240"
        height="148"
        viewBox="0 0 240 148"
        fill="none"
        style={{ position: "absolute", inset: 0 }}
      >
        <rect
          x="8"
          y="8"
          width="224"
          height="132"
          rx="10"
          stroke="rgba(100,58,0,.38)"
          strokeWidth="1"
          fill="none"
        />
        <rect
          x="16"
          y="16"
          width="208"
          height="116"
          rx="8"
          stroke="rgba(100,58,0,.3)"
          strokeWidth="0.8"
          fill="none"
        />
        <polyline
          points="12,34 52,34 52,96 32,96"
          stroke="rgba(80,46,0,.62)"
          strokeWidth="1.2"
          fill="none"
        />
        <circle cx="52" cy="34" r="2.8" fill="rgba(72,42,0,.65)" />
        <circle cx="52" cy="96" r="2.8" fill="rgba(72,42,0,.6)" />
        <line
          x1="12"
          y1="56"
          x2="36"
          y2="56"
          stroke="rgba(80,46,0,.46)"
          strokeWidth="1"
        />
        <line
          x1="12"
          y1="74"
          x2="28"
          y2="74"
          stroke="rgba(80,46,0,.36)"
          strokeWidth="1"
        />
        <polyline
          points="172,24 226,24 226,58"
          stroke="rgba(80,46,0,.42)"
          strokeWidth="1"
          fill="none"
        />
        <line
          x1="180"
          y1="66"
          x2="226"
          y2="66"
          stroke="rgba(80,46,0,.34)"
          strokeWidth="1"
        />
        <circle cx="226" cy="24" r="2" fill="rgba(72,42,0,.48)" />
        <rect
          x="88"
          y="30"
          width="64"
          height="88"
          rx="7"
          fill="rgba(18,10,0,.88)"
          stroke="rgba(170,112,8,.72)"
          strokeWidth="1.7"
        />
        <rect
          x="97"
          y="39"
          width="46"
          height="70"
          rx="4"
          fill="rgba(10,6,0,.92)"
          stroke="rgba(148,94,5,.48)"
          strokeWidth="1"
        />
        <rect
          x="103"
          y="45"
          width="34"
          height="58"
          rx="3"
          fill="rgba(180,120,0,.12)"
          stroke="rgba(160,105,5,.2)"
          strokeWidth="0.6"
        />
        {[102, 114, 126, 138].map((x) => (
          <line
            key={x}
            x1={x}
            y1="30"
            x2={x}
            y2="18"
            stroke="rgba(160,108,6,.72)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        ))}
        {[102, 114, 126, 138].map((x) => (
          <line
            key={x}
            x1={x}
            y1="118"
            x2={x}
            y2="130"
            stroke="rgba(160,108,6,.72)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        ))}
        {[52, 66, 80, 94].map((y) => (
          <line
            key={y}
            x1="88"
            y1={y}
            x2="76"
            y2={y}
            stroke="rgba(160,108,6,.72)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        ))}
        {[52, 66, 80, 94].map((y) => (
          <line
            key={y}
            x1="152"
            y1={y}
            x2="164"
            y2={y}
            stroke="rgba(160,108,6,.72)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        ))}
        <text
          x="120"
          y="13"
          textAnchor="middle"
          fontSize="5.8"
          fill="rgba(88,52,0,.65)"
          fontFamily="sans-serif"
          fontWeight="800"
          letterSpacing="3"
        >
          OMNIDEV PRO
        </text>
        <rect
          x="18"
          y="20"
          width="16"
          height="16"
          rx="2"
          transform="rotate(45 26 28)"
          fill="rgba(72,42,0,.28)"
          stroke="rgba(160,108,6,.48)"
          strokeWidth="1.1"
        />
        <g transform="translate(210,120)">
          <line
            x1="0"
            y1="-10"
            x2="0"
            y2="10"
            stroke="rgba(95,56,0,.7)"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <line
            x1="-8.7"
            y1="-5"
            x2="8.7"
            y2="5"
            stroke="rgba(95,56,0,.7)"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <line
            x1="8.7"
            y1="-5"
            x2="-8.7"
            y2="5"
            stroke="rgba(95,56,0,.7)"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <circle
            cx="0"
            cy="0"
            r="3.2"
            fill="rgba(78,46,0,.4)"
            stroke="rgba(162,106,8,.56)"
            strokeWidth="1.1"
          />
        </g>
        <defs>
          <linearGradient id="gsh" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="24%" stopColor="rgba(255,246,160,.12)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="240" height="148" rx="14" fill="url(#gsh)" />
      </svg>
    </div>
  </div>
);

const mkObs = (cb, threshold = 0.1) =>
  new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting) cb(true);
    },
    { threshold },
  );

export const Home = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [statsTriggered, setStatsTriggered] = useState(false);
  const [featureVisible, setFeatureVisible] = useState(false);
  const [tradingVisible, setTradingVisible] = useState(false);
  const [marketVisible, setMarketVisible] = useState(false);
  const [trustVisible, setTrustVisible] = useState(false);
  const [rewardsVisible, setRewardsVisible] = useState(false);
  const [coinIndex, setCoinIndex] = useState(0);
  const [coinVisible, setCoinVisible] = useState(true);
  const [activeTab, setActiveTab] = useState("crypto");
  const [livePrices, setLivePrices] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const auth = getAuth();

  const statsRef = useRef(null);
  const featureRef = useRef(null);
  const tradingRef = useRef(null);
  const marketRef = useRef(null);
  const trustRef = useRef(null);
  const rewardsRef = useRef(null);
  const timeoutRef = useRef(null);
  const whyRef = useRef(null);
  const trustedRef = useRef(null);
  const footerRef = useRef(null);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleStart = () => {
    if (loading) return;
    navigate(user ? "/dashboard" : "/login");
  };

  // ── CoinGecko REST — works from Nigeria, no WebSocket needed ──
  useEffect(() => {
    let mounted = true;
    let timer = null;

    const fetchPrices = async () => {
      try {
        const ids = CYCLING_COINS.map((c) => c.geckoId).join(",");
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        const updates = {};
        for (const coin of CYCLING_COINS) {
          const val = data[coin.geckoId];
          if (!val) continue;
          const price = val.usd;
          const change = val.usd_24h_change ?? 0;
          if (!isNaN(price)) updates[coin.symbol] = { price, change };
        }
        setLivePrices((p) => ({ ...p, ...updates }));
      } catch (_) {
        // silently fail — static fallback values stay visible
      }
      if (mounted) timer = setTimeout(fetchPrices, 30_000);
    };

    fetchPrices();
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const fmt = (p) => {
    if (p == null || isNaN(p) || p === 0) return "—";
    return p < 1
      ? p.toFixed(4)
      : p.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  };

  // Word typewriter
  useEffect(() => {
    const currentWord = WORDS[wordIndex];
    clearTimeout(timeoutRef.current);

    if (!isDeleting && text === currentWord) {
      timeoutRef.current = setTimeout(() => setIsDeleting(true), 3500);
      return;
    }
    if (isDeleting && text === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % WORDS.length);
      return;
    }
    timeoutRef.current = setTimeout(
      () => {
        setText((prev) =>
          currentWord.substring(0, prev.length + (isDeleting ? -1 : 1)),
        );
      },
      isDeleting ? 140 : 280,
    );

    return () => clearTimeout(timeoutRef.current);
  }, [text, isDeleting, wordIndex]);

  // Coin carousel
  useEffect(() => {
    const id = setInterval(() => {
      setCoinVisible(false);
      setTimeout(() => {
        setCoinIndex((i) => (i + 1) % CYCLING_COINS.length);
        setCoinVisible(true);
      }, 380);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  // Intersection observers
  useEffect(() => {
    const o = mkObs(setStatsTriggered, 0.3);
    if (statsRef.current) o.observe(statsRef.current);
    return () => o.disconnect();
  }, []);
  useEffect(() => {
    const o = mkObs(setFeatureVisible);
    if (featureRef.current) o.observe(featureRef.current);
    return () => o.disconnect();
  }, []);
  useEffect(() => {
    const o = mkObs(setTradingVisible);
    if (tradingRef.current) o.observe(tradingRef.current);
    return () => o.disconnect();
  }, []);
  useEffect(() => {
    const o = mkObs(setMarketVisible);
    if (marketRef.current) o.observe(marketRef.current);
    return () => o.disconnect();
  }, []);
  useEffect(() => {
    const o = mkObs(setTrustVisible);
    if (trustRef.current) o.observe(trustRef.current);
    return () => o.disconnect();
  }, []);
  useEffect(() => {
    const o = mkObs(setRewardsVisible);
    if (rewardsRef.current) o.observe(rewardsRef.current);
    return () => o.disconnect();
  }, []);

  // Navbar scroll targets
  useEffect(() => {
    window.__scrollToHowItWorks = () =>
      whyRef.current?.scrollIntoView({ behavior: "smooth" });
    window.__scrollToAboutUs = () =>
      trustedRef.current?.scrollIntoView({ behavior: "smooth" });
    window.__scrollToFAQ = () =>
      footerRef.current?.scrollIntoView({ behavior: "smooth" });
    return () => {
      delete window.__scrollToHowItWorks;
      delete window.__scrollToAboutUs;
      delete window.__scrollToFAQ;
    };
  }, []);

  const STATS = [
    { value: "7K+", label: "Active Users" },
    { value: "0%", label: "Commission Fee" },
    { value: "$2M+", label: "Volume Traded" },
  ];

  const coin = CYCLING_COINS[coinIndex];
  const liveData = livePrices[coin.symbol];
  const rows = MARKET_DATA[activeTab];

  const gridBg = {
    backgroundImage:
      "linear-gradient(rgba(13,148,136,0.24) 2px,transparent 2px),linear-gradient(90deg,rgba(13,148,136,0.24) 2px,transparent 2px)",
    backgroundSize: "80px 80px",
    filter: "blur(0.4px)",
    WebkitMaskImage:
      "radial-gradient(ellipse 90% 85% at 50% 50%,transparent 35%,black 100%)",
    maskImage:
      "radial-gradient(ellipse 90% 85% at 50% 50%,transparent 35%,black 100%)",
    opacity: 0.98,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#fff",
        overflowX: "hidden",
        width: "100%",
        maxWidth: "100vw",
      }}
    >
      {/* ════ HERO ════ */}
      <section
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "75svh",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${main2})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.35)",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: "820px",
            padding: "0 12px",
          }}
        >
          <p
            style={{
              color: "#2affd0",
              fontSize: "clamp(10px,2vw,13px)",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: "16px",
              marginTop: "36px",
              animation: "heroUp .7s ease .1s both",
            }}
          >
            Next-gen crypto platform
          </p>
          <h1
            style={{
              fontSize: "clamp(40px,7vw,70px)",
              fontWeight: 900,
              lineHeight: 1.4,
              color: "#fff",
              marginBottom: "18px",
              animation: "heroUp .7s ease .25s both",
            }}
          >
            Crypto Trading,{" "}
            <span style={{ display: "inline-block", minWidth: "7ch" }}>
              <span style={{ color: "#0d9488", whiteSpace: "nowrap" }}>
                {text}
                <span
                  style={{
                    marginLeft: "2px",
                    borderRight: "2px solid #0d9488",
                    animation: "blink 1s infinite",
                  }}
                />
              </span>
            </span>{" "}
            Than Ever.
          </h1>
          <p
            style={{
              color: "#9ca3af",
              fontSize: "clamp(15px,2vw,16px)",
              lineHeight: 1.9,
              maxWidth: "500px",
              margin: "0 auto 28px",
              animation: "heroUp .7s ease .4s both",
            }}
          >
            Buy, sell and withdraw instantly. Zero commission fees, real-time
            prices, and seamless withdrawals.
          </p>
          <div style={{ animation: "heroUp .7s ease .55s both" }}>
            <button className="cta-pill" onClick={handleStart}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
              Get Started
            </button>
          </div>
        </div>

        {/* Floating chat button */}
        <button
          style={{
            position: "fixed",
            bottom: "22px",
            right: "22px",
            borderRadius: "50%",
            background: "#e91e8c",
            border: "none",
            padding: "12px",
            zIndex: 9999,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(233,30,140,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </section>

      {/* ════ WHY CHOOSE — "How It Works" scrolls here ════ */}
      <section
        ref={(el) => {
          featureRef.current = el;
          whyRef.current = el;
        }}
        className="bg-[#080808] px-4 py-[60px] md:py-[76px]"
      >
        <div className="max-w-[1060px] mx-auto flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-left gap-9">
          <div
            className={`flex-1 max-w-[440px] flex flex-col items-center md:items-start ${featureVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"} transition-all duration-700`}
          >
            <p className="text-[#0d9488] text-[13px] font-semibold tracking-[0.2em] uppercase mb-3.5">
              Why choose OmniDev
            </p>
            <h2 className="text-[clamp(26px,4vw,44px)] font-black text-white leading-tight mb-5">
              There's no better time than now to{" "}
              <span className="text-[#0d9488]">begin trading.</span>
            </h2>
            <button
              className="cta-pill mt-4 self-center md:self-start mb-10"
              onClick={handleStart}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
              Start Trading Now
            </button>
          </div>

          <div
            className={`flex-1 max-w-[500px] w-full ${featureVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"} transition-all duration-700 delay-200`}
          >
            <div className="relative rounded-[18px] overflow-hidden border border-[#1a1a1a] shadow-[0_0_40px_rgba(13,148,136,0.08)]">
              <img
                src={main3}
                alt="Trading platform"
                className="w-full object-cover min-h-[220px] max-h-[400px]"
              />
              <div
                className={`absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md border border-[#1a1a1a] rounded-xl px-3 py-2 flex items-center justify-between ${coinVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} transition-all duration-300`}
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={coin.logo}
                    alt={coin.symbol}
                    className="w-[30px] h-[30px] rounded-full"
                  />
                  <div>
                    <p className="text-[#6b7280] text-[10px] mb-[2px]">
                      {coin.name} ({coin.symbol})
                    </p>
                    <p className="text-white font-bold text-[15px]">
                      {liveData ? `$${fmt(liveData.price)}` : "loading..."}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${(liveData ? liveData.change >= 0 : coin.up) ? "bg-[#0d948833] text-[#2affd0] border-[#0d948855]" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
                >
                  {(liveData ? liveData.change >= 0 : coin.up) ? "▲" : "▼"}{" "}
                  {liveData
                    ? `${Math.abs(liveData.change).toFixed(2)}%`
                    : coin.change}
                </span>
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                {CYCLING_COINS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-[5px] h-[5px] rounded-full ${i === coinIndex ? "bg-[#0d9488]" : "bg-white/20"}`}
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
        style={{
          position: "relative",
          background: "#0a0a0a",
          padding: "60px 16px 76px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            ...gridBg,
          }}
        />
        <div
          style={{
            position: "relative",
            maxWidth: "1000px",
            margin: "0 auto",
            zIndex: 1,
          }}
        >
          <div
            style={{
              opacity: marketVisible ? 1 : 0,
              transform: marketVisible ? "translateY(0)" : "translateY(20px)",
              transition: "opacity .6s ease, transform .6s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "18px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "5px",
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
                      padding: "6px 18px",
                      borderRadius: "999px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "12px",
                      background: activeTab === tab ? "#0d9488" : "transparent",
                      color: activeTab === tab ? "#fff" : "#6b7280",
                      transition: "background .25s, color .25s",
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
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0d9488")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
              >
                View All{" "}
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
            <h2
              style={{
                fontSize: "clamp(20px,4vw,34px)",
                fontWeight: 900,
                color: "#fff",
                marginBottom: "24px",
              }}
            >
              Market Cap Ranking
            </h2>
          </div>

          <div
            style={{
              background: "#111",
              borderRadius: "16px",
              border: "1px solid #1e1e1e",
              overflow: "hidden",
              opacity: marketVisible ? 1 : 0,
              transform: marketVisible ? "translateY(0)" : "translateY(18px)",
              transition: "opacity .55s ease .15s, transform .55s ease .15s",
              boxShadow: "0 0 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="hide-sm"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 110px 76px 92px",
                padding: "10px 14px",
                borderBottom: "1px solid #1e1e1e",
                color: "#4b5563",
                fontSize: "11px",
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
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: "8px",
                  padding: "25px 14px",
                  borderBottom:
                    i < rows.length - 1 ? "1px solid #1a1a1a" : "none",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "background .2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: row.color + "20",
                      border: `1.5px solid ${row.color}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: row.color,
                      fontWeight: 800,
                      fontSize: "13px",
                    }}
                  >
                    {row.icon}
                  </div>
                  <div>
                    <p
                      style={{
                        color: "#f3f4f6",
                        fontWeight: 700,
                        fontSize: "13px",
                        margin: 0,
                      }}
                    >
                      {row.name}
                    </p>
                    <p
                      style={{
                        color: "#6b7280",
                        fontSize: "10px",
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
                    fontSize: "12px",
                    textAlign: "right",
                    minWidth: "82px",
                  }}
                >
                  {row.cap}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "12px",
                    textAlign: "right",
                    minWidth: "62px",
                    color: row.up ? "#0d9488" : "#ef4444",
                  }}
                >
                  {row.change}
                </span>
                <div
                  style={{
                    minWidth: "82px",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <svg width="82" height="38" viewBox="0 0 100 44" fill="none">
                    <path
                      d={row.path}
                      stroke={row.up ? "#0d9488" : "#ef4444"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
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
          background: "#0a0a0a",
          padding: "40px 16px 52px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 50%,rgba(13,148,136,0.18),transparent 65%),radial-gradient(rgba(42,255,208,0.35) 1.2px,transparent 1.2px)",
            backgroundSize: "100% 100%,50px 50px",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 70% at 50% 50%,transparent 30%,black 100%)",
            maskImage:
              "radial-gradient(ellipse 70% 70% at 50% 50%,transparent 30%,black 100%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <CornerBracket side="left" visible={tradingVisible} />
        <CornerBracket side="right" visible={tradingVisible} />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "1060px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "52px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
              flexWrap: "wrap",
              width: "100%",
            }}
          >
            <div
              style={{
                position: "relative",
                flex: "0 0 auto",
                opacity: tradingVisible ? 1 : 0,
                transform: tradingVisible
                  ? "translateY(0)"
                  : "translateY(24px)",
                transition: "opacity .7s ease .1s, transform .7s ease .1s",
              }}
            >
              <div
                style={{
                  width: "clamp(340px,36vw,390px)",
                  height: "clamp(260px,38vw,420px)",
                  borderRadius: "18px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "#111820",
                  boxShadow: "0 0 50px rgba(13,148,136,0.12)",
                }}
              >
                <img
                  src={traderPhoto}
                  alt="Trader"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "13px",
                flex: "1 1 260px",
                maxWidth: "360px",
              }}
            >
              {ASSET_CARDS.map((card, i) => (
                <div
                  key={card.symbol}
                  style={{
                    background: "rgba(10,14,20,0.75)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "14px",
                    padding: "13px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "13px",
                    opacity: tradingVisible ? 1 : 0,
                    transform: tradingVisible
                      ? "translateX(0)"
                      : "translateX(28px)",
                    transition: `opacity .6s ease ${0.25 + i * 0.15}s, transform .6s ease ${0.25 + i * 0.15}s`,
                    boxShadow: "0 4px 28px rgba(0,0,0,0.4)",
                  }}
                >
                  {/* ── Logo.dev replaces dead Clearbit ── */}
                  <img
                    src={`https://img.logo.dev/${card.domain}?token=pk_f2de552de0004a9190e7740b47a6fc55`}
                    alt={card.name}
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "6px",
                      objectFit: "contain",
                      background: "#0f1720",
                      padding: "4px",
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        color: "#f3f4f6",
                        fontWeight: 700,
                        fontSize: "13px",
                        margin: "0 0 2px",
                      }}
                    >
                      {card.name}
                    </p>
                    <p
                      style={{ color: "#6b7280", fontSize: "11px", margin: 0 }}
                    >
                      {card.symbol}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", marginRight: "8px" }}>
                    <p
                      style={{
                        color: "#f9fafb",
                        fontWeight: 700,
                        fontSize: "14px",
                        margin: "0 0 2px",
                      }}
                    >
                      {card.price}
                    </p>
                    <p
                      style={{
                        color: card.up ? "#2affd0" : "#f87171",
                        fontSize: "11px",
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

          <div
            style={{
              textAlign: "center",
              maxWidth: "560px",
              opacity: tradingVisible ? 1 : 0,
              transform: tradingVisible ? "translateY(0)" : "translateY(22px)",
              transition: "opacity .7s ease .4s, transform .7s ease .4s",
            }}
          >
            <h2
              style={{
                color: "#fff",
                fontSize: "clamp(24px,5vw,44px)",
                fontWeight: 800,
                lineHeight: 1.15,
                margin: "40px 0 16px",
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
                fontSize: "14px",
                lineHeight: 1.7,
                margin: "0 0 28px",
              }}
            >
              Whether you're just getting started or you're an expert, our
              platform is designed for everyone.
            </p>
            <button className="cta-pill" onClick={handleStart}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* ════ TRUSTED PLATFORM — "About Us" scrolls here ════ */}
      <section
        ref={(el) => {
          trustRef.current = el;
          trustedRef.current = el;
        }}
        className="relative bg-[#060608] px-4 pt-[76px] pb-[84px]"
      >
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={gridBg}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[560px] h-[280px] pointer-events-none z-0 -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(ellipse, rgba(13,148,136,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-[880px] mx-auto text-center">
          <div
            className={`transition-all duration-700 ${trustVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
          >
            <p className="text-[#0d9488] text-[13px] font-bold tracking-[0.18em] uppercase mb-4">
              Why traders choose us
            </p>
            <h2 className="text-white text-[clamp(22px,5vw,48px)] font-black leading-[1.12] tracking-[-0.025em] max-w-[740px] mx-auto mb-4">
              The most trusted cryptocurrency trading and arbitrage platform
            </h2>
            <p className="text-gray-500 text-[16px] leading-[1.75] max-w-[520px] mx-auto mb-14">
              Traders who rely on us for unlocking lucrative arbitrage
              opportunities safely and securely.
            </p>
          </div>
        </div>
      </section>

      {/* ════ REWARDS ════ */}
      <section
        ref={rewardsRef}
        className="relative bg-[#0a0a0a] px-4 pt-[60px] pb-[52px] overflow-hidden"
      >
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(rgba(45,255,210,0.45) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-40 sm:opacity-70"
          style={{
            background:
              "radial-gradient(circle at 85% 110%, rgba(45,255,210,0.5), transparent 120px)",
          }}
        />
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 25%, black 100%)",
            maskImage:
              "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 25%, black 100%)",
            background: "#0a0a0a",
          }}
        />

        <div className="relative z-10 max-w-[960px] mx-auto">
          <div
            className={`text-center mb-14 transition-all duration-700 ${rewardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <p className="text-[#0d9488] text-[13px] font-semibold tracking-[0.22em] uppercase mb-3">
              Rewards Program
            </p>
            <h2 className="text-[clamp(26px,5vw,50px)] font-black text-white leading-tight mb-3">
              Earn weekly rewards <span className="text-[#9ae6d6]">as</span>
              <br />
              <span className="text-[#5eead4]">you trade</span>
            </h2>
          </div>

          <div className="flex flex-col items-center text-center md:flex-row md:items-center md:justify-center md:text-left gap-[clamp(20px,6vw,68px)]">
            <div
              className={`flex-[0_1_350px] flex justify-center transition-all duration-700 delay-200 ${rewardsVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
            >
              <StackedCards3D visible={rewardsVisible} />
            </div>
            <div
              className={`flex-1 max-w-[380px] flex flex-col items-center md:items-start gap-5 transition-all duration-700 delay-300 ${rewardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}
            >
              <h3 className="text-[clamp(26px,3vw,30px)] font-black text-[#ddeaea] leading-tight tracking-tight">
                Earn weekly rewards
              </h3>
              <p className="text-[#7dd3c7] text-[16px] leading-relaxed">
                Amplify Your Profits with Weekly Rewards as You Engage in Crypto
                Transactions, Making Every Trade Count Towards Your Financial
                Growth.
              </p>
              <button
                className="cta-pill self-center md:self-start"
                onClick={handleStart}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="13 6 19 12 13 18" />
                </svg>
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════ FOOTER — "FAQ" scrolls here ════ */}
      <section
        ref={footerRef}
        className="relative bg-[#020609] px-4 pt-[60px] pb-[44px] border-t border-[#0d2020] overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none z-0 [background-image:linear-gradient(rgba(13,148,136,0.16)_1px,transparent_2px),linear-gradient(90deg,rgba(13,148,136,0.16)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(ellipse_90%_90%_at_50%_50%,transparent_22%,black_100%)] [-webkit-mask-image:radial-gradient(ellipse_90%_90%_at_50%_50%,transparent_22%,black_100%)]" />
        <div className="relative z-10 max-w-[900px] mx-auto text-center">
          <p className="text-[#0d9488] text-[12px] font-bold tracking-[0.28em] uppercase mb-3">
            OmniDev Pro
          </p>
          <h4 className="text-white text-[clamp(20px,3.5vw,28px)] font-extrabold mb-1">
            Crypto & arbitrage opportunities
          </h4>
          <p className="text-[#0d9488] text-[clamp(20px,3.5vw,30px)] font-extrabold italic mb-5">
            anytime, anywhere.
          </p>
          <p className="text-[#4b6060] text-[16px] leading-relaxed max-w-[460px] mx-auto mb-7">
            Discover and Navigate the Intriguing World of Price Differences
            Across Markets, Unveiling Profitable Avenues in Cryptocurrency
            Trading
          </p>
          <button className="cta-pill" onClick={handleStart}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="13 6 19 12 13 18" />
            </svg>
            Start Trading
          </button>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#0d9488]/30 to-transparent my-9" />
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-gray-500 text-xs font-semibold">Omnidev</span>
            <span className="text-[#1e2e2e] text-xs">•</span>
            <span className="text-gray-500 text-xs">
              Unlocking arbitrage opportunities, anytime, anywhere.
            </span>
          </div>
          <p className="text-[#037676] text-[11px] mt-5">
            © {new Date().getFullYear()} Omnidev Exchange Inc. All Rights
            Reserved.
          </p>
        </div>
      </section>
    </div>
  );
};
