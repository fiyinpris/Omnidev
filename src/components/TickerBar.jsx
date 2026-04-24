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
    // Open Binance WebSocket — real-time prices, no static data
    const streams = COINS.map((c) => `${c.wsSymbol}@miniTicker`).join("/");
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${streams}`,
    );

    ws.onmessage = (event) => {
      try {
        const { data: d } = JSON.parse(event.data);
        if (!d?.s) return;

        const symbol = d.s.replace("USDT", "");
        const coin = COINS.find((c) => c.symbol === symbol);
        if (!coin) return;

        const newPrice = parseFloat(d.c); // current price
        const openPrice = parseFloat(d.o); // 24h open
        const change = ((newPrice - openPrice) / openPrice) * 100;
        const prev = prevPrices.current[symbol]?.price;
        const direction =
          prev !== undefined
            ? newPrice > prev
              ? "up"
              : newPrice < prev
                ? "down"
                : null
            : null;

        prevPrices.current[symbol] = { price: newPrice, change };
        setPrices((p) => ({ ...p, [symbol]: { price: newPrice, change } }));

        if (direction) {
          if (flashTimers.current[symbol])
            clearTimeout(flashTimers.current[symbol]);
          setFlash((p) => ({ ...p, [symbol]: direction }));
          flashTimers.current[symbol] = setTimeout(() => {
            setFlash((p) => ({ ...p, [symbol]: null }));
          }, 800);
        }
      } catch (_) {}
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
          animation: "ticker 30s linear infinite",
          whiteSpace: "nowrap",
          paddingLeft: "1rem",
          willChange: "transform",
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
                    fl === "up"
                      ? "#22c55e"
                      : fl === "down"
                        ? "#ef4444"
                        : "#fff",
                  fontWeight: 500,
                  transition: "color 0.15s ease",
                  minWidth: "70px",
                  display: "inline-block",
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
      <style>{`@keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
    </div>
  );
};
