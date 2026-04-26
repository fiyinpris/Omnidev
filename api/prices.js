export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple,cardano,dogecoin,polkadot,chainlink,avalanche-2,polygon-ecosystem-token,litecoin,tron,uniswap&vs_currencies=usd&include_24hr_change=true",
    );

    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*"); // optional
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch prices" });
  }
}
