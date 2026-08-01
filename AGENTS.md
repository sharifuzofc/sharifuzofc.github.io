# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single **static Vite multi-page portfolio site** (vanilla JS/HTML/CSS, Node 20+, npm). There is **no backend, API, or database** — running the Vite dev server is all that's needed to exercise the product end to end. Standard commands live in `package.json` `scripts` and the `README.md`; only the non-obvious caveats are captured here.

- Run/serve: `npm run dev` starts the Vite dev server on port `5173`. In a headless VM add a host flag if you need external access: `npm run dev -- --host 0.0.0.0`. Note `vite.config.js` sets `server.open: true`, which is a harmless no-op headlessly.
- Build: `npm run build` first runs `scripts/generate-cases.mjs`, which **overwrites tracked files** (`work/*.html` and `public/sitemap.xml`, etc.) with today's date in `lastmod`/`dateModified` fields. Expect a dirty working tree after building; `git checkout -- work/ public/sitemap.xml` to discard those date-only regenerations if you don't intend to commit them.
- Lint: `npm run lint` currently exits non-zero because of a **pre-existing** `no-control-regex` error (plus warnings) in the repo's own source — this is not a setup problem, so don't "fix" it unless asked.
- Browser testing gotcha: the homepage renders a heavy **WebGL / 3D hero scene** (`assets/js/scene3d.js`) plus other animation-heavy effects. In the GPU-less cloud VM this can intermittently crash Chrome ("Aw, Snap!", Error code 4) or momentarily show an unstyled page. Just reload and wait a few seconds for the styled page to appear; navigating directly to a URL (e.g. `/work/finance.html`) is more stable than rapid in-page clicks. The dev server itself is healthy (pages return HTTP 200).
