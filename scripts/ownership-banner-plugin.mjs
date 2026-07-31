/**
 * Vite plugin — injects ownership banner into every built JS/CSS asset
 * and an HTML comment at the top of every built HTML page.
 * esbuild preserves /*! … *‍/ comments during minify.
 */

export const OWNERSHIP_BANNER = `/*!
 * Sharifuz Zaman — Portfolio
 * https://sharifuzofc.github.io/
 * Copyright (c) 2026 Sharifuz Zaman. All rights reserved.
 * Unauthorized copying or redistribution is prohibited.
 */`;

const HTML_BANNER = `<!--
  Sharifuz Zaman — Portfolio
  https://sharifuzofc.github.io/
  Copyright (c) 2026 Sharifuz Zaman. All rights reserved.
  Unauthorized copying or redistribution is prohibited.
-->`;

export function ownershipBannerPlugin() {
  return {
    name: "ownership-banner",
    apply: "build",
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === "chunk" && typeof file.code === "string") {
          if (!file.code.includes("Sharifuz Zaman — Portfolio")) {
            file.code = `${OWNERSHIP_BANNER}\n${file.code}`;
          }
        }
        if (
          file.type === "asset" &&
          typeof file.source === "string" &&
          file.fileName.endsWith(".css")
        ) {
          if (!file.source.includes("Sharifuz Zaman — Portfolio")) {
            file.source = `${OWNERSHIP_BANNER}\n${file.source}`;
          }
        }
      }
    },
    transformIndexHtml(html) {
      if (html.includes("Unauthorized copying or redistribution is prohibited")) {
        return html;
      }
      return `${HTML_BANNER}\n${html}`;
    },
  };
}
