import { useEffect, useRef, useState } from "react";

const COINS = [
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
    symbol: "DOGE",
    wsSymbol: "dogeusdt",
    logo: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
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
    symbol: "MATIC",
    wsSymbol: "maticusdt",
    logo: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
  },
  {
    symbol: "LTC",
    wsSymbol: "ltcusdt",
    logo: "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
  },
  {
    symbol: "TRX",
    wsSymbol: "trxusdt",
    logo: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
  },
  {
    symbol: "UNI",
    wsSymbol: "uniusdt",
    logo: "https://assets.coingecko.com/coins/images/12504/small/uni.jpg",
  },
];

export const TickerBar = () => {
  const [prices, setPrices] = useState({});
  const [flash, setFlash] = useState({});
  const prevRef = useRef({});
  const timers = useRef({});
  const wsRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const connect = () => {
      if (!mounted) return;

      // 🛑 prevent duplicate connections
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        return;
      }

      const streams = COINS.map((c) => `${c.wsSymbol}@miniTicker`).join("/");

      const ws = new WebSocket(
        `wss://stream.binance.com:9443/stream?streams=${streams}`,
      );

      wsRef.current = ws;

      ws.onmessage = (ev) => {
        if (!mounted) return;
        try {
          const parsed = JSON.parse(ev.data);
          const d = parsed.data || parsed;
          if (!d?.s) return;
          const sym = d.s.replace("USDT", "");
          const coin = COINS.find((c) => c.symbol === sym);
          if (!coin) return;
          const newP = parseFloat(d.c),
            open = parseFloat(d.o);
          if (isNaN(newP)) return;
          const change = ((newP - open) / open) * 100;
          const prev = prevRef.current[sym]?.price;
          const dir =
            prev != null
              ? newP > prev
                ? "up"
                : newP < prev
                  ? "down"
                  : null
              : null;
          prevRef.current[sym] = { price: newP, change };
          setPrices((p) => ({ ...p, [sym]: { price: newP, change } }));
          if (dir) {
            clearTimeout(timers.current[sym]);
            setFlash((p) => ({ ...p, [sym]: dir }));
            timers.current[sym] = setTimeout(
              () => setFlash((p) => ({ ...p, [sym]: null })),
              800,
            );
          }
        } catch (_) {}
      };
      ws.onerror = () => {};
      ws.onclose = () => {
        setTimeout(() => {
          if (mounted && wsRef.current === ws) connect();
        }, 3000);
      };
    };

    connect();
    return () => {
      mounted = false;
      wsRef.current?.close();
      wsRef.current = null;
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
                {data ? `$${fmt(data.price)}` : "loading..."}
              </span>
              {data && (
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
      <style>{`@keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-33.333%)}}`}</style>
    </div>
  );
};
