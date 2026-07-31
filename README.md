# Sharifuz Zaman — Portfolio

Live: **[https://sharifuzofc.github.io/](https://sharifuzofc.github.io/)**  
Also deployable on **Vercel** (see below).

Vite multi-page portfolio (web / SQA / design / video) — proprietary source.

## Local development

```bash
npm ci
npm run dev          # Vite dev server
npm run cases        # Regenerate work/*.html + sitemaps under public/
npm run build        # generate-cases + vite build → dist/
npm run preview      # Preview dist/ locally
```

Node.js **20+** recommended (CI uses Node 20).

## Deployment (A → Z)

### A. GitHub Pages (primary — sharifuzofc.github.io)

1. Repo **Settings → Pages → Source: GitHub Actions**
2. Push to `main` (or run **Actions → Deploy to GitHub Pages** manually)
3. Workflow: `.github/workflows/deploy-pages.yml`  
   - `npm ci` → generate cases → `npm run build` → upload `dist/` → deploy Pages

### B. Vercel (recommended mirror / preview)

1. [vercel.com/new](https://vercel.com/new) → **Import** this GitHub repo  
2. Framework preset: **Vite** (or leave blank — `vercel.json` sets it)  
3. Build command: `npm run build` · Output: `dist` · Install: `npm ci`  
4. Deploy — every push to `main` gets a production deployment; PRs get preview URLs  

Config file: **`vercel.json`** (headers, build, output).

Optional CLI (local):

```bash
npx vercel          # preview
npx vercel --prod   # production
```

### C. Private source → public Pages only (optional later)

If you keep source in a **private** `sharifuzofc/portfolio` and publish only `dist/` to this user-site repo:

- Copy the project there, set secret **`PAGES_DEPLOY_TOKEN`**
- Workflow `.github/workflows/deploy.yml` runs **only** when `github.repository == 'sharifuzofc/portfolio'`
- Uses `force_orphan: true` on the public repo (wipes public git history on purpose)

Do **not** run that orphan publish against this repo while it still holds the source.

## Static files in `public/` → `dist/`

Vite copies these as-is (must stay under `public/`):

- `google878e2e14624d19c1.html` — Search Console  
- `.nojekyll` — Pages / no Jekyll  
- `robots.txt`, `sitemap.xml`, `sitemap-images.xml`, `llms.txt`  
- `site.webmanifest`, `assets/`, `js/`, `css/`

## License

Proprietary — see `LICENSE`. All rights reserved.
