import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

/** One self-contained HTML of the site, for the claude.ai preview. */
export default defineConfig({
  root,
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "next/dynamic": fileURLToPath(new URL("./next-dynamic.tsx", import.meta.url)),
      "@": fileURLToPath(new URL("..", import.meta.url)),
    },
  },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: { outDir: "dist", emptyOutDir: true, assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 10_000 },
});
