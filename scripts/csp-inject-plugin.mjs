/**
 * Vite plugin — injects CSP meta with sha256 hashes for every inline <script>
 * (including application/ld+json) so script-src can omit 'unsafe-inline'.
 */
import { createHash } from "node:crypto";
import { CSP_CONTENT } from "./csp.mjs";

function hashInlineScripts(html) {
  const hashes = new Set();
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || "";
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const body = m[2];
    if (!body || !body.trim()) continue;
    const digest = createHash("sha256").update(body, "utf8").digest("base64");
    hashes.add(`'sha256-${digest}'`);
  }
  return [...hashes];
}

function buildCsp(html) {
  const hashes = hashInlineScripts(html);
  if (!hashes.length) return CSP_CONTENT;
  return CSP_CONTENT.replace(
    "script-src 'self'",
    `script-src 'self' ${hashes.join(" ")}`
  );
}

function injectCspMeta(html) {
  const csp = buildCsp(html);
  const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}" />`;
  if (/http-equiv=["']Content-Security-Policy["']/i.test(html)) {
    return html.replace(
      /<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/i,
      meta
    );
  }
  return html.replace(/<head([^>]*)>/i, `<head$1>\n  ${meta}`);
}

export function cspInjectPlugin() {
  return {
    name: "csp-inject",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return injectCspMeta(html);
      },
    },
  };
}
