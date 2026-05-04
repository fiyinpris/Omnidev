import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Shared CoinGecko API client with FAST polling (10s), smart caching,
 * deduplication, and rate-limit backoff.
 */

const STALE_WHILE_REVALIDATE = 10_000;
const RATE_LIMIT_BACKOFF = 60_000;
const REQUEST_TIMEOUT = 8_000;
const MIN_REQUEST_INTERVAL = 5_000;

class CryptoApiClient {
  constructor() {
    this.cache = new Map();
    this.backoffUntil = 0;
    this.pendingPromise = null;
    // Proxy handles the base URL in dev; direct in production
    this.baseUrl = import.meta.env.DEV
      ? "/api/coingecko/api/v3"
      : "https://api.coingecko.com/api/v3";
  }

  async fetchPrices(coins) {
    const now = Date.now();
    const cacheKey = coins.map((c) => c.id).join(",");
    const cached = this.cache.get(cacheKey);

    if (cached && now - cached.ts < STALE_WHILE_REVALIDATE) {
      return cached.data;
    }

    if (now < this.backoffUntil) {
      console.warn("[CryptoApi] Rate limited. Using stale data.");
      return cached?.data ?? {};
    }

    if (cached && now - cached.lastRequestTs < MIN_REQUEST_INTERVAL) {
      return cached.data;
    }

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

    // Build URL properly
    const endpoint = `${this.baseUrl}/simple/price`;
    const url = new URL(
      this.baseUrl.startsWith("http")
        ? endpoint
        : `${window.location.origin}${endpoint}`,
    );

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
        this.backoffUntil = Date.now() + RATE_LIMIT_BACKOFF;
        const retryAfter = res.headers.get("retry-after");
        if (retryAfter) {
          this.backoffUntil = Date.now() + parseInt(retryAfter) * 1000;
        }
        console.warn("[CryptoApi] 429 — backing off");
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

export function useCryptoPrices(coins, intervalMs = 10_000) {
  const [prices, setPrices] = useState({});
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const pricesRef = useRef({});

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
  }, [coins]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!mounted) return;
      await fetchPrices();
    };
    init();

    intervalRef.current = setInterval(
      () => {
        if (!mounted) return;
        fetchPrices();
      },
      Math.max(intervalMs, 5_000),
    );

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
