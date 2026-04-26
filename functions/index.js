const { onCall } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");

let cache = null;
let cacheTime = 0;
const CACHE_DURATION = 10000; // 10 seconds

exports.getCryptoPrices = onCall(async (request) => {
  const { coins = "bitcoin,ethereum,solana", currency = "usd" } = request.data;

  if (cache && Date.now() - cacheTime < CACHE_DURATION) {
    return cache;
  }

  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: coins,
          vs_currencies: currency,
          include_24hr_change: true,
        },
        timeout: 5000,
      },
    );

    cache = response.data;
    cacheTime = Date.now();
    return cache;
  } catch (error) {
    logger.error("CoinGecko API error:", error.message);
    throw new Error("Failed to fetch crypto prices");
  }
});
