import { useEffect, useRef, useState } from "react";
import { useCryptoPrices, fmtPrice } from "../api/crypto";

const COINS = [
  {
    symbol: "BTC",
    id: "bitcoin",
    logo: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  },
  {
    symbol: "ETH",
    id: "ethereum",
    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  {
    symbol: "BNB",
    id: "binancecoin",
    logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  },
  {
    symbol: "SOL",
    id: "solana",
    logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  },
  {
    symbol: "XRP",
    id: "ripple",
    logo: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  },
  {
    symbol: "ADA",
    id: "cardano",
    logo: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  },
  {
    symbol: "DOGE",
    id: "dogecoin",
    logo: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  },
  {
    symbol: "DOT",
    id: "polkadot",
    logo: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  },
  {
    symbol: "LINK",
    id: "chainlink",
    logo: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  },
  {
    symbol: "AVAX",
    id: "avalanche-2",
    logo: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  },
  {
    symbol: "POL",
    id: "polygon-ecosystem-token",
    logo: "https://assets.coingecko.com/coins/images/32440/small/polygon.png?1696533695",
  },
  {
    symbol: "LTC",
    id: "litecoin",
    logo: "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
  },
  {
    symbol: "TRX",
    id: "tron",
    logo: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
  },
  {
    symbol: "UNI",
    id: "uniswap",
    logo: "https://assets.coingecko.com/coins/images/12504/small/uni.jpg",
  },
];

export const TickerBar = () => {
  // Poll every 30 seconds — stays well within CoinGecko free-tier limits
  const { prices: apiPrices, error } = useCryptoPrices(COINS, 30_000);
  const [flash, setFlash] = useState({});
  const prevRef = useRef({});
  const timers = useRef({});

  useEffect(() => {
    const newFlashes = {};
    let hasChanges = false;

    for (const coin of COINS) {
      const data = apiPrices[coin.symbol];
      if (!data || data.price == null) continue;

      const prevPrice = prevRef.current[coin.symbol];

      if (prevPrice != null && Math.abs(prevPrice - data.price) > 0.000001) {
        const dir = data.price > prevPrice ? "up" : "down";
        newFlashes[coin.symbol] = dir;
        hasChanges = true;

        if (timers.current[coin.symbol])
          clearTimeout(timers.current[coin.symbol]);
        timers.current[coin.symbol] = setTimeout(() => {
          setFlash((f) => ({ ...f, [coin.symbol]: null }));
        }, 800);
      }

      prevRef.current[coin.symbol] = data.price;
    }

    if (hasChanges) setFlash((f) => ({ ...f, ...newFlashes }));
  }, [apiPrices]);

  useEffect(
    () => () => Object.values(timers.current).forEach(clearTimeout),
    [],
  );

  const items = [...COINS, ...COINS];

  return (
    <div
      style={{
        background: "#0d0d0d",
        borderBottom: "1px solid #1a1a1a",
        overflow: "hidden",
        height: "40px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes shimmerPulse {
          0%, 100% { opacity: 0.25; }
          50%       { opacity: 0.6; }
        }
        @keyframes flashUp {
          0% { background-color: rgba(34, 197, 94, 0.3); }
          100% { background-color: transparent; }
        }
        @keyframes flashDown {
          0% { background-color: rgba(239, 68, 68, 0.3); }
          100% { background-color: transparent; }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "max-content",
          animation: "tickerScroll 40s linear infinite",
          whiteSpace: "nowrap",
          willChange: "transform",
          flexShrink: 0,
        }}
      >
        {items.map((coin, i) => {
          const data = apiPrices[coin.symbol];
          const fl = flash[coin.symbol];
          const formattedPrice = fmtPrice(data?.price);
          const isLoaded = formattedPrice !== null;

          return (
            <span
              key={`${coin.symbol}-${i}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                padding: "0 24px",
                borderRight: "1px solid #1f1f1f",
                flexShrink: 0,
                animation:
                  fl === "up"
                    ? "flashUp 0.8s ease-out"
                    : fl === "down"
                      ? "flashDown 0.8s ease-out"
                      : "none",
                borderRadius: "4px",
              }}
            >
              <img
                src={coin.logo}
                alt={coin.symbol}
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  objectFit: "cover",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <span style={{ color: "#ccc", fontWeight: 600 }}>
                {coin.symbol}
              </span>

              <span
                style={{
                  color: isLoaded
                    ? fl === "up"
                      ? "#22c55e"
                      : fl === "down"
                        ? "#ef4444"
                        : "#fff"
                    : "#333",
                  fontWeight: 500,
                  transition: "color 0.15s",
                  minWidth: "72px",
                  display: "inline-block",
                  borderRadius: isLoaded ? 0 : "4px",
                  background: isLoaded ? "transparent" : "#222",
                  animation: isLoaded
                    ? "none"
                    : "shimmerPulse 1.2s ease-in-out infinite",
                  height: isLoaded ? "auto" : "14px",
                }}
              >
                {isLoaded ? `$${formattedPrice}` : ""}
              </span>

              {isLoaded && data?.change != null && (
                <span
                  style={{
                    color: data.change >= 0 ? "#22c55e" : "#ef4444",
                    fontSize: "12px",
                    fontWeight: 500,
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
    </div>
  );
};
