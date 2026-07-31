/**
 * Shared Content-Security-Policy for GitHub Pages (meta http-equiv).
 * script-src has no 'unsafe-inline' — executable scripts are external.
 * style-src keeps 'unsafe-inline' for design-token style attributes
 * (style="--score:…", SVG stagger, etc.); see deliverable notes.
 */

export const CSP_CONTENT = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://api.fontshare.com https://fonts.googleapis.com",
  "font-src 'self' https://cdn.fontshare.com https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://formspree.io",
  "form-action 'self' https://formspree.io mailto:",
  "upgrade-insecure-requests",
].join("; ");

/** HTML meta tags shared by index, 404, and generated case pages */
export function securityMetaHtml() {
  return `  <meta http-equiv="Content-Security-Policy" content="${CSP_CONTENT}" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta name="copyright" content="© 2026 Sharifuz Zaman" />`;
}
