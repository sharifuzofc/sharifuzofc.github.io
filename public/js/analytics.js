/**
 * Google Analytics (gtag) — externalized for CSP (no inline scripts).
 * Measurement ID is public by design (not a secret).
 */
window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
window.gtag = gtag;
gtag("js", new Date());
gtag("config", "G-EQM31CXY13");
