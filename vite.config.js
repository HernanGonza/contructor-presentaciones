import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// El editor también sale como un único index.html (se puede abrir sin servidor ni red).
// Necesita que exista dist-player/player.html (npm run build:player), que usa como plantilla de exportación.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: "./",
  server: { proxy: { "/api": process.env.API_URL || "http://localhost:3000" } },
  build: { outDir: "dist", assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 100_000 },
});
