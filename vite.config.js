import { resolve } from "node:path";
import { defineConfig } from "vite";
import { ownershipBannerPlugin } from "./scripts/ownership-banner-plugin.mjs";
import { cspInjectPlugin } from "./scripts/csp-inject-plugin.mjs";

/**
 * Build config for https://sharifuzofc.github.io/ (user site = domain root).
 * `base` must stay '/' — never '/repo-name/'.
 */
export default defineConfig({
  base: "/",
  root: ".",
  publicDir: "public",
  plugins: [ownershipBannerPlugin(), cspInjectPlugin()],
  build: {
    // Published to sharifuzofc/sharifuzofc.github.io via .github/workflows/deploy.yml
    outDir: "dist",
    emptyOutDir: true,
    // Never ship sourcemaps to the public Pages repo (would expose original source)
    sourcemap: false,
    minify: "esbuild",
    cssMinify: "esbuild",
    esbuild: {
      // Keep /*! … */ ownership banners inside minified JS/CSS
      legalComments: "inline",
    },
    assetsDir: "assets",
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
      output: {
        // Content-hashed filenames so deploys cache-bust correctly
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  server: {
    open: true,
  },
});
