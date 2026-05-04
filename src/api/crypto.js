import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Shared CoinGecko API client with 30s polling, smart caching,
 * deduplication, and rate-limit backoff.
 * Routes through /api/coingecko proxy to avoid CORS.
 */

const STALE_WHILE_REVALIDATE = 30_000; // treat data fresh for 30s
const RATE_LIMIT_BACKOFF = 65_000; // wait 65s after a 429
const REQUEST_TIMEOUT = 8_000;
const MIN_REQUEST_INTERVAL = 25_000; // never hit the API more often than every 25s

class CryptoApiClient {
  constructor() {
    this.cache = new Map();
    this.backoffUntil = 0;
    this.pendingPromise = null;
    this.baseUrl = "/api/coingecko/api/v3/simple/price";
  }

  async fetchPrices(coins) {
    const now = Date.now();
    const cacheKey = coins.map((c) => c.id).join(",");
    const cached = this.cache.get(cacheKey);

    // Fresh cache hit — return immediately, no request
    if (cached && now - cached.ts < STALE_WHILE_REVALIDATE) {
      return cached.data;
    }

    // Still in rate-limit backoff window
    if (now < this.backoffUntil) {
      console.warn("[CryptoApi] Rate limited. Using stale data.");
      return cached?.data ?? {};
    }

    // Throttle: don't re-request the same coins within MIN_REQUEST_INTERVAL
    if (cached && now - cached.lastRequestTs < MIN_REQUEST_INTERVAL) {
      return cached.data;
    }

    // Deduplicate concurrent callers — return the in-flight promise
    if (this.pendingPromise) {
      return this.pendingPromise;
    }

    this.pendingPromise = this._doFetch(coins, cacheKey).finally(() => {
      this.pendingPromise = null;
    });

    return this.pendingPromise;
  }

  async _doFetch(coins, cacheKey) {
    const ids = coins.map((c) => c.id).join(",");
    const url = new URL(`${window.location.origin}${this.baseUrl}`);
    url.searchParams.append("ids", ids);
    url.searchParams.append("vs_currencies", "usd");
    url.searchParams.append("include_24hr_change", "true");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeoutId);

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        this.backoffUntil = retryAfter
          ? Date.now() + parseInt(retryAfter, 10) * 1000
          : Date.now() + RATE_LIMIT_BACKOFF;
        console.warn(
          "[CryptoApi] 429 — backing off until",
          new Date(this.backoffUntil).toLocaleTimeString(),
        );
        return this.cache.get(cacheKey)?.data ?? {};
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

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

      this.cache.set(cacheKey, {
        data,
        ts: Date.now(),
        lastRequestTs: Date.now(),
      });

      return data;
    } catch (err) {
      if (err.name === "AbortError") {
        console.warn("[CryptoApi] Request timed out");
      } else {
        console.error("[CryptoApi] Fetch error:", err.message);
      }
      return this.cache.get(cacheKey)?.data ?? {};
    }
  }

  clearCache() {
    this.cache.clear();
    this.backoffUntil = 0;
  }
}

const globalClient = new CryptoApiClient();

export function useCryptoPrices(coins, intervalMs = 30_000) {
  const [prices, setPrices] = useState({});
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const pricesRef = useRef({});

  // Stable cache key so useCallback doesn't rebuild on every render
  // even if the caller passed a new array reference with the same coins.
  const coinsKey = coins.map((c) => c.id).join(",");

  const fetchPrices = useCallback(async () => {
    const data = await globalClient.fetchPrices(coins);
    if (Object.keys(data).length > 0) {
      pricesRef.current = { ...pricesRef.current, ...data };
      setPrices({ ...pricesRef.current });
      setError(null);
    } else if (Object.keys(pricesRef.current).length === 0) {
      setError(
        "Unable to fetch prices. API may be rate-limited or unavailable.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinsKey]); // ← string dep, not array reference

  useEffect(() => {
    let mounted = true;

    fetchPrices(); // initial fetch on mount

    // Start interval AFTER the first fetch, so we don't double-fire
    const effectiveInterval = Math.max(intervalMs, 30_000);
    intervalRef.current = setInterval(() => {
      if (mounted) fetchPrices();
    }, effectiveInterval);

    return () => {
      mounted = false;
      clearInterval(intervalRef.current);
    };
  }, [fetchPrices, intervalMs]);

  return { prices, error };
}

export async function fetchCryptoPrices(coins) {
  return globalClient.fetchPrices(coins);
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

export { globalClient };
