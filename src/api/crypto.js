import { useState, useRef, useEffect, useCallback } from "react";

const STALE_MS = 30_000;
const MIN_INTERVAL_MS = 25_000;
const RATE_LIMIT_BACKOFF_MS = 65_000;
const REQUEST_TIMEOUT_MS = 8_000;

class CryptoApiClient {
  constructor() {
    this.cache = new Map();
    this.backoffUntil = 0;
    this.pending = null;
  }

  async fetchPrices(coins) {
    const now = Date.now();
    const key = coins.map((c) => c.id).join(",");
    const cached = this.cache.get(key);

    if (cached && now - cached.ts < STALE_MS) return cached.data;
    if (now < this.backoffUntil) return cached?.data ?? {};
    if (cached && now - cached.lastRequestTs < MIN_INTERVAL_MS)
      return cached.data;
    if (this.pending) return this.pending;

    this.pending = this._fetch(coins, key).finally(() => {
      this.pending = null;
    });

    return this.pending;
  }

  async _fetch(coins, key) {
    const url = new URL(`${window.location.origin}/api/coingecko`);
    url.searchParams.append("ids", coins.map((c) => c.id).join(","));

    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(tid);

      if (res.status === 429) {
        this.backoffUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;
        return this.cache.get(key)?.data ?? {};
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = await res.json();
      const data = {};

      for (const coin of coins) {
        const val = raw[coin.id];
        if (!val) continue;
        data[coin.symbol] = {
          price: val.usd,
          change: val.usd_24h_change ?? 0,
        };
      }

      this.cache.set(key, { data, ts: Date.now(), lastRequestTs: Date.now() });
      return data;
    } catch (err) {
      console.error("[CryptoApi]", err.message);
      return this.cache.get(key)?.data ?? {};
    }
  }
}

const globalClient = new CryptoApiClient();

export function useCryptoPrices(coins) {
  const [prices, setPrices] = useState({});
  const [error, setError] = useState(null);
  const coinsKey = coins.map((c) => c.id).join(",");

  const fetch = useCallback(async () => {
    const data = await globalClient.fetchPrices(coins);
    if (Object.keys(data).length > 0) {
      setPrices(data);
      setError(null);
    } else {
      setError("Unable to fetch prices.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinsKey]);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, STALE_MS);
    return () => clearInterval(id);
  }, [fetch]);

  return { prices, error };
}

export function fmtPrice(p) {
  if (p == null || isNaN(p) || p === 0) return null;
  return p < 1
    ? p.toFixed(4)
    : p.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}
