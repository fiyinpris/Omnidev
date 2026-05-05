import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api/coingecko": {
        target: "https://api.coingecko.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          // path includes the query string, e.g. /api/coingecko?ids=bitcoin,...
          const [pathname, query] = path.split("?");
          const params = new URLSearchParams(query);
          params.set("vs_currencies", "usd");
          params.set("include_24hr_change", "true");
          return `/api/v3/simple/price?${params.toString()}`;
        },
      },
    },
  },
});
