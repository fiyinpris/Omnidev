import { useEffect, useRef, useState } from "react";

const COINS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    id: "bitcoin",
    logo: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    id: "ethereum",
    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  {
    symbol: "BNB",
    name: "BNB",
    id: "binancecoin",
    logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  },
  {
    symbol: "SOL",
    name: "Solana",
    id: "solana",
    logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  },
  {
    symbol: "XRP",
    name: "XRP",
    id: "ripple",
    logo: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  },
  {
    symbol: "ADA",
    name: "Cardano",
    id: "cardano",
    logo: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    id: "dogecoin",
    logo: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  },
  {
    symbol: "DOT",
    name: "Polkadot",
    id: "polkadot",
    logo: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    id: "chainlink",
    logo: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    id: "avalanche-2",
    logo: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  },
  {
    symbol: "POL",
    name: "Polygon",
    id: "polygon-ecosystem-token",
    logo: "https://assets.coingecko.com/coins/images/32440/small/polygon-ecosystem-token.png",
  },
  {
    symbol: "LTC",
    name: "Litecoin",
    id: "litecoin",
    logo: "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
  },
  {
    symbol: "TRX",
    name: "TRON",
    id: "tron",
    logo: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    id: "uniswap",
    logo: "https://assets.coingecko.com/coins/images/12504/small/uni.jpg",
  },
];

const IDS = COINS.map((c) => c.id).join(",");

export const TickerBar = () => {
  const [prices, setPrices] = useState({});
  const [flash, setFlash] = useState({});
  const prevRef = useRef({});
  const timers = useRef({});

  useEffect(() => {
    let mounted = true;

    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/prices");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        const newPrices = {};
        const newFlashes = {};

        for (const coin of COINS) {
          const val = data[coin.id];
          if (!val) continue;

          const newPrice = val.usd;
          if (newPrice == null || isNaN(newPrice)) continue;

          const prevPrice = prevRef.current[coin.symbol]?.price;

          newPrices[coin.symbol] = {
            price: newPrice,
            change: val.usd_24h_change ?? 0,
          };

          if (prevPrice != null) {
            const dir =
              newPrice > prevPrice
                ? "up"
                : newPrice < prevPrice
                  ? "down"
                  : null;

            if (dir) {
              newFlashes[coin.symbol] = dir;
              clearTimeout(timers.current[coin.symbol]);
              timers.current[coin.symbol] = setTimeout(() => {
                if (mounted) {
                  setFlash((f) => ({ ...f, [coin.symbol]: null }));
                }
              }, 800);
            }
          }

          prevRef.current[coin.symbol] = { price: newPrice };
        }

        setPrices(newPrices);
        if (Object.keys(newFlashes).length > 0) {
          setFlash((f) => ({ ...f, ...newFlashes }));
        }
      } catch (err) {
        console.error("Ticker fetch error:", err);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const fmt = (p) => {
    if (p == null || isNaN(p)) return "—";
    return p < 1
      ? p.toFixed(4)
      : p.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  };

  const items = [...COINS, ...COINS, ...COINS];

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
          const data = prices[coin.symbol];
          const fl = flash[coin.symbol];
          return (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                padding: "0 24px",
                borderRight: "1px solid #1f1f1f",
                flexShrink: 0,
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
                }}
              />
              <span style={{ color: "#ccc", fontWeight: 600 }}>
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
                  minWidth: "72px",
                  display: "inline-block",
                }}
              >
                {data?.price != null ? `$${fmt(data.price)}` : "—"}
              </span>
              {data?.price != null && (
                <span
                  style={{
                    color: data.change >= 0 ? "#22c55e" : "#ef4444",
                    fontSize: "12px",
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
      <style>{`@keyframes tickerScroll { 0% { transform: translateX(0) } 100% { transform: translateX(-33.333%) } }`}</style>
    </div>
  );
};
