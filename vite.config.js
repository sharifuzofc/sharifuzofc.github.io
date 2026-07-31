import { resolve } from "node:path";
import { defineConfig } from "vite";
import { ownershipBannerPlugin } from "./scripts/ownership-banner-plugin.mjs";
import { cspInjectPlugin } from "./scripts/csp-inject-plugin.mjs";

export default defineConfig({
  // User site: https://sharifuzofc.github.io/ (domain root — not a /repo-name/ project site)
  base: "/",
  root: ".",
  publicDir: "public",
  plugins: [ownershipBannerPlugin(), cspInjectPlugin()],
  build: {
    // Must match .github/workflows/deploy-pages.yml artifact path
    outDir: "dist",
    emptyOutDir: true,
    // Keep /*! … */ ownership banners inside minified JS/CSS (not moved to EOF)
    minify: "esbuild",
    cssMinify: "esbuild",
    esbuild: {
      legalComments: "inline",
    },
    // If switching to terser later: format.comments = /^!/
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        notFound: resolve(__dirname, "404.html"),
        finance: resolve(__dirname, "work/finance.html"),
        pulse: resolve(__dirname, "work/pulse.html"),
        orizon: resolve(__dirname, "work/orizon.html"),
        fundo: resolve(__dirname, "work/fundo.html"),
        brawlhalla: resolve(__dirname, "work/brawlhalla.html"),
        dsm: resolve(__dirname, "work/dsm.html"),
        metaspark: resolve(__dirname, "work/metaspark.html"),
        summary: resolve(__dirname, "work/summary.html"),
        taskflow: resolve(__dirname, "work/taskflow.html"),
        arrival: resolve(__dirname, "work/arrival.html"),
        shoplane: resolve(__dirname, "work/shoplane.html"),
        lumen: resolve(__dirname, "work/lumen.html"),
      },
    },
  },
  server: {
    open: true,
  },
});
