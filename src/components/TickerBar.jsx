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
  const wsRef = useRef(null);
  const fallbackRef = useRef(null);

  // ✅ INITIAL FETCH (only once)
  const fetchPrices = async () => {
    try {
      const ids = COINS.map((c) => c.id).join(",");
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      );
      const data = await res.json();

      const mapped = {};
      COINS.forEach((c) => {
        mapped[c.symbol] = {
          price: data[c.id]?.usd ?? 0,
          change: data[c.id]?.usd_24h_change ?? 0,
        };
      });

      setPrices(mapped);
      prevPrices.current = mapped;
    } catch (e) {
      console.error("Fetch failed:", e);
    }
  };

  // ✅ START FALLBACK ONLY WHEN NEEDED
  const startFallback = () => {
    if (fallbackRef.current) return;

    console.log("⚠️ Fallback mode (10s updates)");

    fallbackRef.current = setInterval(fetchPrices, 10000);
  };

  const stopFallback = () => {
    if (fallbackRef.current) {
      clearInterval(fallbackRef.current);
      fallbackRef.current = null;
    }
  };

  // ✅ CONNECT WEBSOCKET
  const connectWS = () => {
    const streams = COINS.map((c) => `${c.wsSymbol}@miniTicker`).join("/");
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${streams}`,
    );

    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WS Connected");
      stopFallback(); // stop fallback if WS is back
    };

    ws.onmessage = (event) => {
      const { data } = JSON.parse(event.data);

      const symbol = data.s.replace("USDT", "");
      const coin = COINS.find((c) => c.symbol === symbol);
      if (!coin) return;

      const newPrice = parseFloat(data.c);
      const openPrice = parseFloat(data.o);
      const change = ((newPrice - openPrice) / openPrice) * 100;

      const prev = prevPrices.current[coin.symbol]?.price;

      let direction = null;
      if (prev !== undefined) {
        if (newPrice > prev) direction = "up";
        else if (newPrice < prev) direction = "down";
      }

      prevPrices.current[coin.symbol] = { price: newPrice, change };

      setPrices((prevState) => ({
        ...prevState,
        [coin.symbol]: { price: newPrice, change },
      }));

      if (direction) {
        setFlash((prev) => ({ ...prev, [coin.symbol]: direction }));
        setTimeout(() => {
          setFlash((prev) => ({ ...prev, [coin.symbol]: null }));
        }, 600);
      }
    };

    ws.onerror = () => {
      console.log("❌ WS Error → fallback");
      startFallback();
      reconnect();
    };

    ws.onclose = () => {
      console.log("❌ WS Closed → reconnecting");
      startFallback();
      reconnect();
    };
  };

  // ✅ RECONNECT LOGIC
  const reconnect = () => {
    setTimeout(() => {
      connectWS();
    }, 3000);
  };

  useEffect(() => {
    fetchPrices(); // initial load
    connectWS();

    return () => {
      wsRef.current?.close();
      stopFallback();
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
    <div className="bg-[#0d0d0d] border-b border-[#1a1a1a] overflow-hidden h-[40px] flex items-center">
      <div className="flex gap-12 animate-[ticker_25s_linear_infinite] whitespace-nowrap pl-4">
        {items.map((coin, i) => {
          const data = prices[coin.symbol];
          const flashDir = flash[coin.symbol];

          return (
            <span
              key={i}
              className="inline-flex items-center gap-2 text-[13px] border-r border-[#1f1f1f] pr-12"
            >
              <img src={coin.logo} className="w-[18px] h-[18px] rounded-full" />

              <span className="text-gray-300 font-semibold">{coin.symbol}</span>

              <span
                className={`font-medium transition ${
                  flashDir === "up"
                    ? "text-green-500"
                    : flashDir === "down"
                      ? "text-red-500"
                      : "text-white"
                }`}
              >
                ${data ? fmt(data.price) : "—"}
              </span>

              {data && (
                <span
                  className={`text-[12px] flex items-center gap-[2px] ${
                    data.change >= 0 ? "text-green-500" : "text-red-500"
                  }`}
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
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};
