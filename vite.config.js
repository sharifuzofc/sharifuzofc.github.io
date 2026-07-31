import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        finance: resolve(__dirname, "work/finance.html"),
        brawlhalla: resolve(__dirname, "work/brawlhalla.html"),
        fundo: resolve(__dirname, "work/fundo.html"),
        metaspark: resolve(__dirname, "work/metaspark.html"),
        notFound: resolve(__dirname, "404.html"),
      },
    },
  },
  server: {
    open: true,
  },
});
