export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const ids = req.query.ids;
  if (!ids) return res.status(400).json({ error: "Missing ids parameter" });

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
        "x-cg-demo-api-key": process.env.COINGECKO_API_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        return res
          .status(429)
          .json({
            error: "Rate limited",
            retryAfter: response.headers.get("retry-after") || "60",
          });
      }
      return res
        .status(502)
        .json({ error: `CoinGecko returned ${response.status}` });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch prices", message: error.message });
  }
}
