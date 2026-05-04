export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ids = req.query.ids;
  if (!ids) {
    return res.status(400).json({ error: "Missing ids parameter" });
  }

  try {
    const coingeckoUrl = new URL(
      "https://api.coingecko.com/api/v3/simple/price",
    );
    coingeckoUrl.searchParams.append("ids", ids);
    coingeckoUrl.searchParams.append("vs_currencies", "usd");
    coingeckoUrl.searchParams.append("include_24hr_change", "true");

    const response = await fetch(coingeckoUrl.toString(), {
      headers: {
        Accept: "application/json",
        // Optional: Add your CoinGecko API key here if you have one
        // 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY
      },
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return res.status(429).json({
          error: "Rate limited by CoinGecko",
          retryAfter: response.headers.get("retry-after") || "60",
        });
      }
      return res.status(502).json({
        error: `CoinGecko returned ${status}`,
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("[API] Error fetching prices:", error);
    res.status(500).json({
      error: "Failed to fetch prices",
      message: error.message,
    });
  }
}
