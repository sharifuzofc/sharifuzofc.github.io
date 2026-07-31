/**
 * Ownership canary — harmless fingerprint for provenance / DMCA evidence.
 * Search strings:
 *   1) CSS: --sz-build-id: "SZ-PORTFOLIO-CANARY-9E2B"  (src/styles/tokens.css)
 *   2) JS comment: @sz-canary:SZ-PORTFOLIO-CANARY-9E2B
 *   3) HTML: data-sz-origin="sharifuzofc.github.io" (+ data-sz-canary on <html>)
 */
/* @sz-canary:SZ-PORTFOLIO-CANARY-9E2B */
export const SZ_CANARY = "SZ-PORTFOLIO-CANARY-9E2B";
if (typeof document !== "undefined" && document.documentElement) {
  document.documentElement.dataset.szCanary = SZ_CANARY;
  if (document.body && !document.body.dataset.szOrigin) {
    document.body.dataset.szOrigin = "sharifuzofc.github.io";
  }
}
