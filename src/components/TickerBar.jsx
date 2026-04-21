import { useEffect, useRef, useState } from "react";

const COINS = [
  {
    id: "bitcoin",
    symbol: "BTC",
    wsSymbol: "btcusdt",
    logo: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  },
  {
    id: "ethereum",
    symbol: "ETH",
    wsSymbol: "ethusdt",
    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  {
    id: "binancecoin",
    symbol: "BNB",
    wsSymbol: "bnbusdt",
    logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  },
  {
    id: "solana",
    symbol: "SOL",
    wsSymbol: "solusdt",
    logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  },
  {
    id: "ripple",
    symbol: "XRP",
    wsSymbol: "xrpusdt",
    logo: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  },
  {
    id: "cardano",
    symbol: "ADA",
    wsSymbol: "adausdt",
    logo: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  },
  {
    id: "dogecoin",
    symbol: "DOGE",
    wsSymbol: "dogeusdt",
    logo: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  },
  {
    id: "polkadot",
    symbol: "DOT",
    wsSymbol: "dotusdt",
    logo: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  },
  {
    id: "chainlink",
    symbol: "LINK",
    wsSymbol: "linkusdt",
    logo: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  },
  {
    id: "avalanche-2",
    symbol: "AVAX",
    wsSymbol: "avaxusdt",
    logo: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  },
  {
    id: "matic-network",
    symbol: "MATIC",
    wsSymbol: "maticusdt",
    logo: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
  },
  {
    id: "litecoin",
    symbol: "LTC",
    wsSymbol: "ltcusdt",
    logo: "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
  },
  {
    id: "tron",
    symbol: "TRX",
    wsSymbol: "trxusdt",
    logo: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
  },
  {
    id: "uniswap",
    symbol: "UNI",
    wsSymbol: "uniusdt",
    logo: "https://assets.coingecko.com/coins/images/12504/small/uni.jpg",
  },
];

export const TickerBar = () => {
  const [prices, setPrices] = useState({});
  const [flash, setFlash] = useState({});
  const prevPrices = useRef({});
  const flashTimers = useRef({});

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const ids = COINS.map((c) => c.id).join(",");
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        );
        const data = await res.json();
        const initial = {};
        COINS.forEach((c) => {
          initial[c.symbol] = {
            price: data[c.id]?.usd ?? 0,
            change: data[c.id]?.usd_24h_change ?? 0,
          };
        });
        setPrices(initial);
        prevPrices.current = initial;
      } catch (e) {
        console.error("Initial fetch failed:", e);
      }
    };
    fetchInitial();

    const streams = COINS.map((c) => `${c.wsSymbol}@miniTicker`).join("/");
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${streams}`,
    );

    ws.onmessage = (event) => {
      const { data: streamData } = JSON.parse(event.data);
      const symbol = streamData.s.replace("USDT", "");
      const coin = COINS.find((c) => c.symbol === symbol);
      if (!coin) return;

      const newPrice = parseFloat(streamData.c);
      const openPrice = parseFloat(streamData.o);
      const change = ((newPrice - openPrice) / openPrice) * 100;
      const prevPrice = prevPrices.current[coin.symbol]?.price;
      const direction =
        prevPrice !== undefined
          ? newPrice > prevPrice
            ? "up"
            : newPrice < prevPrice
              ? "down"
              : null
          : null;

      prevPrices.current[coin.symbol] = { price: newPrice, change };

      setPrices((prev) => ({
        ...prev,
        [coin.symbol]: { price: newPrice, change },
      }));

      if (direction) {
        if (flashTimers.current[coin.symbol]) {
          clearTimeout(flashTimers.current[coin.symbol]);
        }
        setFlash((prev) => ({ ...prev, [coin.symbol]: direction }));
        flashTimers.current[coin.symbol] = setTimeout(() => {
          setFlash((prev) => ({ ...prev, [coin.symbol]: null }));
        }, 800);
      }
    };

    ws.onerror = (e) => console.error("WS error:", e);
    return () => {
      ws.close();
      Object.values(flashTimers.current).forEach(clearTimeout);
    };
  }, []);

  const fmt = (p) =>
    p < 1
      ? p.toFixed(4)
      : p.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

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
      <div
        style={{
          display: "flex",
          gap: "3rem",
          animation: "ticker 25s linear infinite",
          whiteSpace: "nowrap",
          paddingLeft: "1rem",
        }}
      >
        {items.map((coin, i) => {
          const data = prices[coin.symbol];
          const flashDir = flash[coin.symbol];

          return (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                borderRight: "1px solid #1f1f1f",
                paddingRight: "3rem",
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
                    flashDir === "up"
                      ? "#22c55e"
                      : flashDir === "down"
                        ? "#ef4444"
                        : "#fff",
                  fontWeight: 500,
                  transition: "color 0.15s ease",
                }}
              >
                ${data ? fmt(data.price) : "—"}
              </span>
              {data && (
                <span
                  style={{
                    color: data.change >= 0 ? "#22c55e" : "#ef4444",
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
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

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};
