import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  // User site: https://sharifuzofc.github.io/ (not a /repo-name/ project site)
  base: "/",
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
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
        notFound: resolve(__dirname, "404.html"),
      },
    },
  },
  server: {
    open: true,
  },
});
