/**
 * Generates all case-study HTML pages under /work/.
 * Run: node scripts/generate-cases.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "work");

const ACCENT = {
  web: { badge: "Web Dev", class: "badge-web", accent: "cyan", css: "web" },
  sqa: { badge: "SQA", class: "badge-sqa", accent: "green", css: "sqa" },
  design: { badge: "Design", class: "badge-design", accent: "violet", css: "design" },
  video: { badge: "Video", class: "badge-video", accent: "orange", css: "video" },
};

/** @typedef {{ slug: string, short: string, title: string, cat: keyof typeof ACCENT, outcome: string, year: string, type: string, role: string, tools: string[], image?: string, useSvg?: "finance" | "pulse" | boolean, process: {n:string,t:string,d:string}[], brief: string, myRole: string, result: string, stats: {v:string,l:string}[], proof: object, draft?: boolean }} Case */

/** @type {Case[]} */
const CASES = [
  {
    slug: "finance",
    short: "Finance",
    title: "Finance — Fintech Web App",
    cat: "web",
    outcome: "90+ Lighthouse · responsive UI + REST integration shipped",
    year: "2025",
    type: "Web App",
    role: "Web-App Developer",
    tools: ["React", "Tailwind", "REST API", "JavaScript", "Git"],
    useSvg: "finance",
    process: [
      { n: "01", t: "Scope & IA", d: "Mapped dashboard flows, auth edges, and mobile breakpoints before pixels." },
      { n: "02", t: "UI Build", d: "Shipped componentized React views with a performance-first Tailwind layout." },
      { n: "03", t: "API Wire-up", d: "Integrated REST endpoints for balances, transfers, and live chart data." },
      { n: "04", t: "Polish & Ship", d: "Lighthouse pass, cross-browser QA, then production deploy." },
    ],
    brief: "A fintech product needed a clear, mobile-ready dashboard that stayed fast under real API load — not a slide-deck mock.",
    myRole: "End-to-end web build: UI architecture, REST integration, responsive polish, and pre-launch performance QA.",
    result: "Delivered a production-ready fintech UI with Core Web Vitals in the green and a maintainable component stack for future features.",
    stats: [
      { v: "90+", l: "Lighthouse" },
      { v: "REST", l: "Live APIs" },
      { v: "100%", l: "Responsive" },
    ],
    proof: {
      kind: "web",
      lighthouse: 92,
      before: "4.8s",
      after: "1.9s",
      stack: ["React", "Tailwind", "REST API", "Vite-ready structure"],
    },
  },
  {
    slug: "pulse",
    short: "Pulse",
    title: "Pulse — Analytics Dashboard",
    cat: "web",
    // EDIT-ME: refine outcome when metrics are client-approved
    outcome: "Built real-time charts UI with role-based views",
    year: "2025",
    type: "Web App",
    role: "Web-App Developer",
    tools: ["React", "Chart.js", "REST API", "JavaScript"],
    useSvg: "pulse",
    process: [
      // EDIT-ME: replace process steps with the real delivery narrative
      { n: "01", t: "Roles & Metrics", d: "Mapped viewer vs admin permissions and the KPI set that had to stay live." },
      { n: "02", t: "Chart System", d: "Built Chart.js views with a shared dark-glass visual language for donut, bars, and tiles." },
      { n: "03", t: "Live Data", d: "Wired REST polling/streams so role-gated panels refresh without full reloads." },
      { n: "04", t: "Handoff QA", d: "Performance pass, empty/error states, and responsive checks before launch." },
    ],
    brief: "<!-- EDIT-ME: replace with the real product brief -->",
    myRole: "Built the analytics UI end-to-end — chart composition, role-based views, and REST-backed live panels.",
    result: "A dark analytics dashboard where operators see live KPIs and charts filtered to their role — without a slide-deck mock feeling.",
    stats: [
      { v: "Live", l: "Chart UI" },
      { v: "RBAC", l: "Role views" },
      { v: "90+", l: "Lighthouse" },
    ],
    proof: {
      kind: "web",
      lighthouse: 91,
      before: "—",
      after: "—",
      stack: ["React", "Chart.js", "REST API"],
    },
    draft: true,
  },
  {
    slug: "orizon",
    short: "Orizon",
    title: "Orizon — Travel Platform",
    cat: "web",
    outcome: "Shipped booking UI with live analytics views",
    year: "2025",
    type: "Web Platform",
    role: "Web-App Developer",
    tools: ["React", "JavaScript", "REST API"],
    image: "/assets/images/project-2.png",
    process: [
      { n: "01", t: "Flow Map", d: "Defined search → results → booking → confirmation paths." },
      { n: "02", t: "UI System", d: "Built responsive React screens with analytics widgets." },
      { n: "03", t: "Data Views", d: "Wired REST-backed charts and booking state." },
      { n: "04", t: "QA Pass", d: "Device smoke + empty/error states before handoff." },
    ],
    brief: "<!-- EDIT-ME: replace with the real product brief -->",
    myRole: "Built the booking UI and live analytics surfaces, then validated flows before handoff.",
    result: "A travel booking interface that surfaces live analytics without burying the conversion path.",
    stats: [
      { v: "Live", l: "Analytics UI" },
      { v: "React", l: "Component UI" },
      { v: "REST", l: "Data layer" },
    ],
    proof: {
      kind: "web",
      lighthouse: 90,
      before: "—",
      after: "—",
      stack: ["React", "JavaScript", "REST API"],
    },
    draft: true,
  },
  {
    slug: "fundo",
    short: "Fundo",
    title: "Fundo — Brand Design",
    cat: "design",
    outcome: "Crafted brand identity + web visual system",
    year: "2024",
    type: "Brand Identity",
    role: "Graphics Designer",
    tools: ["Photoshop", "Illustrator", "Figma"],
    image: "/assets/images/project-3.jpg",
    process: [
      { n: "01", t: "Discovery", d: "Positioning, audience cues, and competitive visual audit." },
      { n: "02", t: "Concept", d: "Logo directions and mood frames until one system won." },
      { n: "03", t: "System", d: "Color, type, and component rules for web + social." },
      { n: "04", t: "Delivery", d: "Export-ready kits and usage notes for handoff." },
    ],
    brief: "<!-- EDIT-ME: replace with the real brand brief -->",
    myRole: "Owned identity direction through delivery — logo, palette, type, and web-ready visual system.",
    result: "A cohesive brand kit that scales from logo lockups to web and social assets without looking patchworked.",
    stats: [
      { v: "Full", l: "Brand kit" },
      { v: "Web", l: "Visual system" },
      { v: "Social", l: "Templates" },
    ],
    proof: {
      kind: "design",
      colors: ["#0B1F38", "#22D3EE", "#A78BFA", "#F472B6", "#F8FAFC"],
      type: ["Display / Clash-style bold", "Body / Satoshi"],
      delivers: ["Logo suite", "Color tokens", "Type scale", "Social templates", "Web UI cues"],
    },
    draft: true,
  },
  {
    slug: "brawlhalla",
    short: "Brawlhalla",
    title: "Brawlhalla — Mobile App QA",
    cat: "sqa",
    outcome: "98% pass rate · 120+ automated regression cases",
    year: "2025",
    type: "Mobile QA",
    role: "SQA Engineer",
    tools: ["Cypress", "Selenium", "JIRA", "Postman", "TestRail"],
    image: "/assets/images/project-4.png",
    process: [
      { n: "01", t: "Test Plan", d: "Risk-based scope: auth, matchmaking edges, payments-adjacent flows." },
      { n: "02", t: "Cases", d: "Wrote executable cases covering happy path + failure modes." },
      { n: "03", t: "Automation", d: "Cypress regression suite for the highest-churn paths." },
      { n: "04", t: "Report", d: "JIRA defects with repro steps; pass-rate summary for stakeholders." },
    ],
    brief: "<!-- EDIT-ME: replace with the real QA engagement brief -->",
    myRole: "Owned manual + automation coverage — plan, cases, Cypress suite, and defect reporting in JIRA.",
    result: "Regression confidence before ship: 120+ automated cases with a 98% pass rate and clear defect triage.",
    stats: [
      { v: "98%", l: "Pass rate" },
      { v: "120+", l: "Auto cases" },
      { v: "JIRA", l: "Defect log" },
    ],
    proof: {
      kind: "sqa",
      pass: 98,
      cases: "120+",
      defects: [
        { sev: "P1", count: "0" },
        { sev: "P2", count: "3" },
        { sev: "P3", count: "7" },
      ],
      tools: ["Cypress", "Selenium", "JIRA", "Postman", "TestRail"],
    },
    draft: true,
  },
  {
    slug: "dsm",
    short: "DSM.",
    title: "DSM. — Product Branding",
    cat: "design",
    outcome: "Designed product brand system for launch kits",
    year: "2024",
    type: "Product Branding",
    role: "Graphics Designer",
    tools: ["Figma", "Illustrator", "Brand"],
    image: "/assets/images/project-5.png",
    process: [
      { n: "01", t: "Position", d: "Clarified product story and launch channel mix." },
      { n: "02", t: "Identity", d: "Wordmark, marks, and lockup rules." },
      { n: "03", t: "Launch Kit", d: "Packaging/social/web assets from one system." },
      { n: "04", t: "Handoff", d: "Figma library + export specs." },
    ],
    brief: "<!-- EDIT-ME: replace with the real product branding brief -->",
    myRole: "Designed the product brand system and launch kit assets end-to-end in Figma + Illustrator.",
    result: "A launch-ready brand system that stays consistent across kit pieces and digital touchpoints.",
    stats: [
      { v: "Kit", l: "Launch assets" },
      { v: "Figma", l: "Source of truth" },
      { v: "1", l: "Visual system" },
    ],
    proof: {
      kind: "design",
      colors: ["#111827", "#38BDF8", "#818CF8", "#FBBF24", "#F9FAFB"],
      type: ["Product display", "UI / body"],
      delivers: ["Logo system", "Launch kit", "Social frames", "Brand rules"],
    },
    draft: true,
  },
  {
    slug: "metaspark",
    short: "MetaSpark",
    title: "MetaSpark — Visuals & Video",
    cat: "video",
    outcome: "Edited motion creatives + campaign visuals",
    year: "2025",
    type: "Motion / Campaign",
    role: "Video Editor",
    tools: ["Premiere Pro", "After Effects", "Photoshop"],
    image: "/assets/images/project-6.png",
    process: [
      { n: "01", t: "Script / Hook", d: "Locked the first-3-seconds retention cut." },
      { n: "02", t: "Edit", d: "Paced A-roll/B-roll with caption rhythm." },
      { n: "03", t: "Grade & Motion", d: "Color pass + AE lower-thirds / transitions." },
      { n: "04", t: "Deliver", d: "Export packs for Reels and 4K masters." },
    ],
    brief: "<!-- EDIT-ME: replace with the real campaign brief -->",
    myRole: "Edited campaign motion creatives — hooks, captions, grade, and multi-format delivery.",
    result: "Retention-first edits packaged for social and master delivery without re-cutting from scratch.",
    stats: [
      { v: "3s", l: "Hook focus" },
      { v: "4K", l: "Master out" },
      { v: "Reels", l: "Social cut" },
    ],
    proof: {
      kind: "video",
      retention: "Hook in 3s",
      formats: ["Reels / Shorts", "4K master", "Captioned cut"],
      runtime: "15–45s variants",
    },
    draft: true,
  },
  {
    slug: "summary",
    short: "Summary",
    title: "Summary — SaaS App",
    cat: "web",
    outcome: "Built SaaS UI with performance-first layout",
    year: "2025",
    type: "SaaS UI",
    role: "Web-App Developer",
    tools: ["JavaScript", "CSS3", "SEO"],
    image: "/assets/images/project-7.png",
    process: [
      { n: "01", t: "IA", d: "Prioritized core SaaS loops over decorative chrome." },
      { n: "02", t: "Layout", d: "Performance-first CSS with lean JS interactions." },
      { n: "03", t: "SEO Base", d: "Semantic structure and meta foundations." },
      { n: "04", t: "Ship Check", d: "Lighthouse + responsive QA before release." },
    ],
    brief: "<!-- EDIT-ME: replace with the real SaaS brief -->",
    myRole: "Built the SaaS UI shell with a performance-first layout and SEO-ready structure.",
    result: "A lean SaaS interface that loads clean and stays usable across viewports.",
    stats: [
      { v: "90+", l: "Perf target" },
      { v: "SEO", l: "Base ready" },
      { v: "CSS3", l: "Layout" },
    ],
    proof: {
      kind: "web",
      lighthouse: 91,
      before: "—",
      after: "—",
      stack: ["JavaScript", "CSS3", "SEO"],
    },
    draft: true,
  },
  {
    slug: "taskflow",
    short: "TaskFlow",
    title: "TaskFlow — API Testing",
    cat: "sqa",
    outcome: "Validated 80+ API flows with Postman & JMeter",
    year: "2025",
    type: "API QA",
    role: "SQA Engineer",
    tools: ["Postman", "JMeter", "TestRail"],
    image: "/assets/images/project-8.jpg",
    process: [
      { n: "01", t: "Contract Map", d: "Catalogued endpoints, auth, and expected status codes." },
      { n: "02", t: "Collections", d: "Postman suites for CRUD + negative paths." },
      { n: "03", t: "Load Spot", d: "JMeter smoke on critical task APIs." },
      { n: "04", t: "Traceability", d: "TestRail cases linked to defects and results." },
    ],
    brief: "<!-- EDIT-ME: replace with the real API testing brief -->",
    myRole: "Designed and executed API validation — Postman flows, JMeter smoke, TestRail traceability.",
    result: "80+ API flows validated with clear pass/fail evidence before the UI team leaned on the contract.",
    stats: [
      { v: "80+", l: "API flows" },
      { v: "200", l: "Happy-path OK" },
      { v: "Load", l: "JMeter smoke" },
    ],
    proof: {
      kind: "sqa",
      pass: 97,
      cases: "80+",
      defects: [
        { sev: "P1", count: "1" },
        { sev: "P2", count: "4" },
        { sev: "P3", count: "5" },
      ],
      tools: ["Postman", "JMeter", "TestRail"],
    },
    draft: true,
  },
  {
    slug: "arrival",
    short: "Arrival",
    title: "Arrival — Campaign Site",
    cat: "web",
    outcome: "Coded campaign site with scroll-driven motion",
    year: "2024",
    type: "Campaign Site",
    role: "Web-App Developer",
    tools: ["JavaScript", "CSS3", "Performance"],
    image: "/assets/images/project-9.png",
    process: [
      { n: "01", t: "Storyboard", d: "Section narrative mapped to scroll beats." },
      { n: "02", t: "Build", d: "Semantic HTML + CSS motion with JS scroll cues." },
      { n: "03", t: "Perf Guard", d: "Reduced paint cost; prefers-reduced-motion fallback." },
      { n: "04", t: "Launch QA", d: "Device pass + Lighthouse check." },
    ],
    brief: "<!-- EDIT-ME: replace with the real campaign site brief -->",
    myRole: "Coded the campaign experience — scroll-driven motion, responsive layout, and performance guardrails.",
    result: "A campaign landing that feels alive on scroll without tanking Core Web Vitals.",
    stats: [
      { v: "Scroll", l: "Motion story" },
      { v: "CWV", l: "Perf-aware" },
      { v: "RM", l: "Reduced-motion" },
    ],
    proof: {
      kind: "web",
      lighthouse: 90,
      before: "—",
      after: "—",
      stack: ["JavaScript", "CSS3", "Performance"],
    },
    draft: true,
  },
  {
    slug: "shoplane",
    short: "ShopLane",
    title: "ShopLane — Checkout QA",
    cat: "sqa",
    outcome: "96% pass rate · end-to-end checkout smoke across devices",
    year: "2025",
    type: "E2E QA",
    role: "SQA Engineer",
    tools: ["Selenium", "TestRail", "JIRA"],
    image: "/assets/images/project-4.png",
    process: [
      { n: "01", t: "Risk Matrix", d: "Cart → payment → confirmation as P0 paths." },
      { n: "02", t: "Cases", d: "Device matrix smoke + edge coupons/shipping." },
      { n: "03", t: "Automation", d: "Selenium scripts for repeatable checkout." },
      { n: "04", t: "Report", d: "TestRail runs + JIRA bugs with screenshots." },
    ],
    brief: "<!-- EDIT-ME: replace with the real checkout QA brief -->",
    myRole: "Ran end-to-end checkout smoke across devices — Selenium automation, TestRail, JIRA defects.",
    result: "Checkout confidence before promo traffic: 96% pass rate with prioritized defect clear-down.",
    stats: [
      { v: "96%", l: "Pass rate" },
      { v: "E2E", l: "Checkout" },
      { v: "Multi", l: "Devices" },
    ],
    proof: {
      kind: "sqa",
      pass: 96,
      cases: "E2E suite",
      defects: [
        { sev: "P1", count: "0" },
        { sev: "P2", count: "2" },
        { sev: "P3", count: "6" },
      ],
      tools: ["Selenium", "TestRail", "JIRA"],
    },
    draft: true,
  },
  {
    slug: "lumen",
    short: "Lumen",
    title: "Lumen — Social Brand Kit",
    cat: "design",
    outcome: "Designed social kit + thumbnail system for launch",
    year: "2024",
    type: "Social Brand Kit",
    role: "Graphics Designer",
    tools: ["Photoshop", "Figma", "Illustrator"],
    image: "/assets/images/project-5.png",
    process: [
      { n: "01", t: "Channel Map", d: "Formats for feed, stories, and thumbnails." },
      { n: "02", t: "System", d: "Grid, type, and accent rules that survive crop." },
      { n: "03", t: "Templates", d: "Editable Figma + Photoshop masters." },
      { n: "04", t: "Launch Pack", d: "Export set ready for first posting week." },
    ],
    brief: "<!-- EDIT-ME: replace with the real social kit brief -->",
    myRole: "Designed the social brand kit and thumbnail system — templates, type, and export-ready assets.",
    result: "A thumbnail + social system that stays on-brand at every crop and platform size.",
    stats: [
      { v: "Kit", l: "Social system" },
      { v: "Thumbs", l: "Click-first" },
      { v: "Figma", l: "Editable" },
    ],
    proof: {
      kind: "design",
      colors: ["#070B14", "#22D3EE", "#F472B6", "#FB923C", "#E2E8F0"],
      type: ["Thumbnail display", "Caption / UI"],
      delivers: ["Feed templates", "Story frames", "YouTube thumbs", "Export guide"],
    },
    draft: true,
  },
];

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function draftAttr(c) {
  return c.draft ? ' data-draft="true"' : "";
}

function draftClass(c) {
  return c.draft ? " is-draft" : "";
}

function financeSvg() {
  return `<div class="cs-art-svg" aria-hidden="true">
      <svg viewBox="0 0 720 440" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="720" height="440" rx="20" fill="#071525"/>
        <rect x="24" y="24" width="672" height="392" rx="16" fill="rgba(11,31,56,0.92)" stroke="rgba(34,211,238,0.4)"/>
        <rect x="24" y="24" width="672" height="44" rx="16" fill="rgba(34,211,238,0.1)"/>
        <circle cx="52" cy="46" r="6" fill="#f472b6"/><circle cx="74" cy="46" r="6" fill="#fb923c"/><circle cx="96" cy="46" r="6" fill="#34d399"/>
        <text x="128" y="52" fill="#7dd3fc" font-size="14" font-family="monospace">finance.app / dashboard</text>
        <rect x="52" y="96" width="184" height="100" rx="12" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.35)"/>
        <text x="72" y="132" fill="#94a3b8" font-size="12" font-family="monospace">BALANCE</text>
        <text x="72" y="168" fill="#e0f2fe" font-size="28" font-family="system-ui,sans-serif" font-weight="700">$24.8k</text>
        <rect x="256" y="96" width="184" height="100" rx="12" fill="rgba(52,211,153,0.08)" stroke="rgba(52,211,153,0.35)"/>
        <text x="276" y="132" fill="#94a3b8" font-size="12" font-family="monospace">GROWTH</text>
        <text x="276" y="168" fill="#bbf7d0" font-size="28" font-family="system-ui,sans-serif" font-weight="700">+12%</text>
        <rect x="460" y="96" width="196" height="100" rx="12" fill="rgba(167,139,250,0.08)" stroke="rgba(167,139,250,0.35)"/>
        <text x="480" y="132" fill="#94a3b8" font-size="12" font-family="monospace">API OK</text>
        <text x="480" y="168" fill="#e9d5ff" font-size="28" font-family="system-ui,sans-serif" font-weight="700">200</text>
        <rect x="52" y="220" width="420" height="160" rx="12" fill="rgba(7,21,37,0.75)" stroke="rgba(34,211,238,0.28)"/>
        <path d="M84 340 L136 300 L188 312 L240 268 L292 284 L344 248 L396 264" stroke="#22d3ee" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="396" cy="264" r="6" fill="#22d3ee"/>
        <rect x="496" y="220" width="160" height="160" rx="12" fill="rgba(7,21,37,0.75)" stroke="rgba(34,211,238,0.28)"/>
        <rect x="528" y="320" width="18" height="36" rx="3" fill="rgba(34,211,238,0.5)"/>
        <rect x="556" y="292" width="18" height="64" rx="3" fill="rgba(34,211,238,0.75)"/>
        <rect x="584" y="268" width="18" height="88" rx="3" fill="#22d3ee"/>
        <rect x="612" y="284" width="18" height="72" rx="3" fill="rgba(125,211,252,0.7)"/>
      </svg>
    </div>`;
}

function pulseSvg() {
  return `<div class="cs-art-svg" aria-hidden="true">
      <svg viewBox="0 0 720 440" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="720" height="440" rx="20" fill="#071525"/>
        <rect x="24" y="24" width="672" height="392" rx="16" fill="rgba(11,31,56,0.92)" stroke="rgba(34,211,238,0.35)"/>
        <rect x="24" y="24" width="672" height="44" rx="16" fill="rgba(129,140,248,0.12)"/>
        <circle cx="52" cy="46" r="6" fill="#f472b6"/><circle cx="74" cy="46" r="6" fill="#fb923c"/><circle cx="96" cy="46" r="6" fill="#34d399"/>
        <text x="128" y="52" fill="#c4b5fd" font-size="14" font-family="monospace">pulse.app / analytics</text>
        <circle cx="176" cy="210" r="88" stroke="rgba(129,140,248,0.22)" stroke-width="18" fill="none"/>
        <circle cx="176" cy="210" r="88" stroke="#818cf8" stroke-width="18" fill="none" stroke-linecap="round" stroke-dasharray="360 192" transform="rotate(-90 176 210)"/>
        <circle cx="176" cy="210" r="88" stroke="#22d3ee" stroke-width="18" fill="none" stroke-linecap="round" stroke-dasharray="110 442" stroke-dashoffset="-360" transform="rotate(-90 176 210)"/>
        <text x="176" y="202" text-anchor="middle" fill="#e0e7ff" font-size="28" font-family="system-ui,sans-serif" font-weight="700">68%</text>
        <text x="176" y="228" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="monospace">LIVE</text>
        <rect x="320" y="100" width="168" height="110" rx="14" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.4)"/>
        <text x="340" y="140" fill="#94a3b8" font-size="13" font-family="monospace">ACTIVE</text>
        <text x="340" y="182" fill="#e0f2fe" font-size="32" font-family="system-ui,sans-serif" font-weight="700">1.2k</text>
        <rect x="508" y="100" width="168" height="110" rx="14" fill="rgba(52,211,153,0.08)" stroke="rgba(52,211,153,0.4)"/>
        <text x="528" y="140" fill="#94a3b8" font-size="13" font-family="monospace">UPTIME</text>
        <text x="528" y="182" fill="#bbf7d0" font-size="32" font-family="system-ui,sans-serif" font-weight="700">99.9%</text>
        <rect x="320" y="232" width="356" height="148" rx="14" fill="rgba(7,21,37,0.75)" stroke="rgba(129,140,248,0.3)"/>
        <rect x="344" y="260" width="250" height="16" rx="6" fill="rgba(34,211,238,0.75)"/>
        <rect x="344" y="292" width="188" height="16" rx="6" fill="rgba(129,140,248,0.7)"/>
        <rect x="344" y="324" width="290" height="16" rx="6" fill="rgba(251,146,60,0.65)"/>
        <text x="610" y="274" fill="#64748b" font-size="12" font-family="monospace">API</text>
        <text x="610" y="306" fill="#64748b" font-size="12" font-family="monospace">UI</text>
        <text x="610" y="338" fill="#64748b" font-size="12" font-family="monospace">QA</text>
      </svg>
    </div>`;
}

function caseArt(c) {
  if (c.useSvg === "pulse") return pulseSvg();
  if (c.useSvg === "finance" || c.useSvg === true) return financeSvg();
  return `<img src="${esc(c.image)}" alt="${esc(c.title)}" width="1200" height="750" decoding="async" />`;
}

function proofBlock(c) {
  const p = c.proof;
  if (p.kind === "sqa") {
    return `<section class="cs-proof liquid-glass liquid-glass--card cs-reveal" data-accent="sqa"${draftAttr(c)}>
      <span class="lg-shine"></span>
      <h2>Proof</h2>
      <div class="cs-proof-grid">
        <div class="cs-gauge" style="--p:${p.pass}">
          <span class="cs-gauge-val">${p.pass}%</span>
          <span class="cs-gauge-label mono">Pass rate</span>
        </div>
        <div class="cs-proof-stat">
          <strong>${esc(p.cases)}</strong>
          <span class="mono">Cases executed</span>
        </div>
        <div class="cs-defect-table-wrap">
          <table class="cs-defect-table">
            <thead><tr><th>Severity</th><th>Count</th></tr></thead>
            <tbody>
              ${p.defects.map((d) => `<tr><td>${esc(d.sev)}</td><td>${esc(d.count)}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>
      <ul class="cs-tools" aria-label="QA tools">
        ${p.tools.map((t) => `<li class="cs-tool">${esc(t)}</li>`).join("")}
      </ul>
    </section>`;
  }
  if (p.kind === "web") {
    return `<section class="cs-proof liquid-glass liquid-glass--card cs-reveal" data-accent="web"${draftAttr(c)}>
      <span class="lg-shine"></span>
      <h2>Proof</h2>
      <div class="cs-proof-grid">
        <div class="cs-ring" style="--score:${p.lighthouse}">
          <span class="cs-ring-val">${p.lighthouse}</span>
          <span class="cs-ring-label mono">Lighthouse</span>
        </div>
        <div class="cs-ba">
          <div><span class="mono">Before</span><strong>${esc(p.before)}</strong></div>
          <div><span class="mono">After</span><strong>${esc(p.after)}</strong></div>
        </div>
        <ul class="cs-stack-list">
          ${p.stack.map((s) => `<li>${esc(s)}</li>`).join("")}
        </ul>
      </div>
    </section>`;
  }
  if (p.kind === "design") {
    return `<section class="cs-proof liquid-glass liquid-glass--card cs-reveal" data-accent="design"${draftAttr(c)}>
      <span class="lg-shine"></span>
      <h2>Proof</h2>
      <div class="cs-color-strip" aria-label="Color system">
        ${p.colors.map((hex) => `<span style="--sw:${hex}" title="${esc(hex)}"></span>`).join("")}
      </div>
      <div class="cs-type-spec">
        ${p.type.map((t) => `<p>${esc(t)}</p>`).join("")}
      </div>
      <ul class="cs-check-list">
        ${p.delivers.map((d) => `<li>${esc(d)}</li>`).join("")}
      </ul>
    </section>`;
  }
  return `<section class="cs-proof liquid-glass liquid-glass--card cs-reveal" data-accent="video"${draftAttr(c)}>
      <span class="lg-shine"></span>
      <h2>Proof</h2>
      <div class="cs-proof-grid cs-proof-grid--video">
        <div class="cs-proof-stat">
          <strong>${esc(p.retention)}</strong>
          <span class="mono">Retention focus</span>
        </div>
        <div class="cs-proof-stat">
          <strong>${esc(p.runtime)}</strong>
          <span class="mono">Runtime</span>
        </div>
        <ul class="cs-tools" aria-label="Deliverable formats">
          ${p.formats.map((f) => `<li class="cs-tool">${esc(f)}</li>`).join("")}
        </ul>
      </div>
    </section>`;
}

function navHtml() {
  return `<header class="nav" data-nav>
    <div class="nav-glass liquid-glass liquid-glass--bar" aria-hidden="true"><span class="lg-shine"></span></div>
    <a href="/#home" class="nav-logo" data-nav-logo aria-label="Sharifuz Zaman — web developer, SQA engineer, graphics designer, video editor">
      <span class="nav-logo-avatar" aria-hidden="true">
        <span class="nav-logo-ring" data-logo-ring></span>
        <img src="/assets/profile.jpg" alt="" width="38" height="38" decoding="async" />
      </span>
      <span class="nav-logo-copy">
        <span class="nav-logo-name">SharifuzZaman<span class="nav-logo-cursor">_</span></span>
        <span class="nav-logo-role" data-logo-role aria-hidden="true">
          <span class="nav-logo-role-stage" data-logo-role-stage></span>
          <span class="nav-logo-playhead" data-logo-playhead hidden></span>
        </span>
        <span class="nav-logo-role-static" data-logo-role-static hidden>web · sqa · design · video</span>
      </span>
    </a>
    <nav class="nav-desktop" aria-label="Primary" data-nav-desktop>
      <span class="nav-pill liquid-glass" data-nav-pill aria-hidden="true"><span class="lg-shine"></span></span>
      <a href="/#home" data-nav-link data-section="home"><sup>01</sup> <span class="c-cyan">//</span> home</a>
      <a href="/#services" data-nav-link data-section="services"><sup>02</sup> <span class="c-cyan">//</span> services</a>
      <a href="/#work" data-nav-link data-section="work" class="is-active"><sup>03</sup> <span class="c-cyan">//</span> work</a>
      <a href="/#process" data-nav-link data-section="process"><sup>04</sup> <span class="c-cyan">//</span> process</a>
      <a href="/#about" data-nav-link data-section="about"><sup>05</sup> <span class="c-cyan">//</span> about</a>
      <a href="/#contact" data-nav-link data-section="contact"><sup>06</sup> <span class="c-cyan">//</span> contact</a>
    </nav>
    <span class="nav-avail liquid-glass liquid-glass--green mono" aria-label="Availability status">
      <span class="lg-shine"></span><span class="avail-dot" aria-hidden="true"></span> Available for projects
    </span>
    <a class="nav-hire liquid-glass liquid-glass--cyan" href="/#contact"><span class="lg-shine"></span>Hire me <span aria-hidden="true">→</span></a>
    <button class="nav-burger" type="button" data-burger aria-label="Open menu" aria-expanded="false" aria-controls="nav-drawer">
      <span></span><span></span><span></span>
    </button>
  </header>
  <nav class="nav-drawer" id="nav-drawer" data-nav-drawer aria-label="Mobile">
    <a href="/#home"><sup>01</sup> <span class="c-cyan">//</span> home</a>
    <a href="/#services"><sup>02</sup> <span class="c-cyan">//</span> services</a>
    <a href="/#work"><sup>03</sup> <span class="c-cyan">//</span> work</a>
    <a href="/#process"><sup>04</sup> <span class="c-cyan">//</span> process</a>
    <a href="/#about"><sup>05</sup> <span class="c-cyan">//</span> about</a>
    <a href="/#contact"><sup>06</sup> <span class="c-cyan">//</span> contact</a>
  </nav>`;
}

function footerHtml() {
  return `<footer class="premium-footer" id="footer">
    <div class="footer-aurora" aria-hidden="true"></div>
    <div class="footer-inner">
      <div class="footer-cta">
        <p class="mono footer-kicker">● OPEN FOR NEW PROJECTS — DHAKA · WORLDWIDE</p>
        <h2 class="footer-title">
          <span class="footer-title-line">Let’s build something</span>
          <span class="footer-title-line"><em>sky-level</em> together.</span>
        </h2>
        <div class="footer-cta-row">
          <a class="footer-cta-primary liquid-glass liquid-glass--cyan" href="/#contact">
            <span class="lg-shine"></span>
            Start a project <span aria-hidden="true">→</span>
          </a>
          <button
            type="button"
            class="footer-copy-chip liquid-glass"
            data-copy="sharifuzofc@gmail.com"
            aria-label="Copy email address sharifuzofc@gmail.com"
          >
            <span class="lg-shine"></span>
            <span data-copy-label>sharifuzofc@gmail.com</span>
            <span class="sr-only" aria-live="polite" data-copy-live></span>
          </button>
        </div>
      </div>
      <nav class="footer-cols" aria-label="Footer">
        <div>
          <h4 class="mono">Navigate</h4>
          <ul>
            <li><a class="footer-link" href="/#home">Home</a></li>
            <li><a class="footer-link" href="/#services">Services</a></li>
            <li><a class="footer-link" href="/#work">Work</a></li>
            <li><a class="footer-link" href="/#process">Process</a></li>
            <li><a class="footer-link" href="/#about">About</a></li>
            <li><a class="footer-link" href="/#contact">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 class="mono">Services</h4>
          <ul>
            <li>
              <a class="footer-link footer-svc" href="/#svc-web">
                <span class="footer-svc-dot" style="--svc:#22d3ee" aria-hidden="true"></span>Web-App Dev
              </a>
            </li>
            <li>
              <a class="footer-link footer-svc" href="/#svc-sqa">
                <span class="footer-svc-dot" style="--svc:#34d399" aria-hidden="true"></span>SQA Engineering
              </a>
            </li>
            <li>
              <a class="footer-link footer-svc" href="/#svc-design">
                <span class="footer-svc-dot" style="--svc:#a78bfa" aria-hidden="true"></span>Graphics Design
              </a>
            </li>
            <li>
              <a class="footer-link footer-svc" href="/#svc-video">
                <span class="footer-svc-dot" style="--svc:#fb923c" aria-hidden="true"></span>Video Editing
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="mono">Connect</h4>
          <div class="footer-connect">
            <a class="footer-social liquid-glass" href="https://github.com/sharifuzofc" target="_blank" rel="noopener">
              <span class="lg-shine"></span>GitHub
            </a>
            <a class="footer-social liquid-glass" href="https://www.facebook.com/sharifuzz/" target="_blank" rel="noopener">
              <span class="lg-shine"></span>Facebook
            </a>
            <a class="footer-social liquid-glass" href="https://www.instagram.com/muhammad_sharifuz/" target="_blank" rel="noopener">
              <span class="lg-shine"></span>Instagram
            </a>
            <a class="footer-phone mono" href="tel:+8801919729159">+880 1919-729159</a>
          </div>
        </div>
      </nav>
    </div>
    <div class="footer-bar">
      <p class="mono footer-copy">
        <span class="footer-copy-brand">© 2026 AZAdemy Studio</span>
        <span class="footer-copy-sep" aria-hidden="true">·</span>
        <span class="footer-oma">ONE MAN ARMY</span>
      </p>
      <p class="mono footer-terminal" aria-label="Built, tested, branded, and edited by one person">
        $ built · tested · branded · edited — by one person<span class="nav-logo-cursor" aria-hidden="true">_</span>
      </p>
      <a class="footer-top-chip liquid-glass" href="#top" data-footer-top>
        <span class="lg-shine"></span>Back to top ↑
      </a>
    </div>
  </footer>
  <button class="to-top liquid-glass" data-back-to-top aria-label="Back to top"><span class="lg-shine"></span>↑</button>`;
}

function renderCase(c, next) {
  const meta = ACCENT[c.cat];
  const url = `https://sharifuzofc.github.io/work/${c.slug}.html`;
  const art = caseArt(c);

  const briefBody = c.brief.startsWith("<!--")
    ? `${c.brief}\n          <p class="cs-draft-copy"${draftAttr(c)}>Product needed a clear, shippable outcome — scoped tightly, executed end-to-end, and validated before handoff.</p>`
    : `<p>${esc(c.brief)}</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(c.title)} | Sharifuz Zaman</title>
  <meta name="description" content="${esc(c.outcome)} — case study by Sharifuz Zaman." />
  <link rel="canonical" href="${url}" />
  <meta property="og:title" content="${esc(c.title)} | Sharifuz Zaman" />
  <meta property="og:description" content="${esc(c.outcome)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="https://sharifuzofc.github.io/assets/images/logo.svg" />
  <link rel="shortcut icon" href="/assets/images/logo.ico" type="image/x-icon" />
  <link rel="apple-touch-icon" href="/assets/images/logo.svg" />
  <link rel="preconnect" href="https://api.fontshare.com" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=satoshi@400,500,700&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Work", "item": "https://sharifuzofc.github.io/#work" },
      { "@type": "ListItem", "position": 2, "name": "${esc(c.short)}", "item": "${url}" }
    ]
  }
  </script>
  <script type="module" src="/src/case-study.js"></script>
</head>
<body class="cs-body" data-case="${esc(c.slug)}" data-discipline="${esc(c.cat)}">
  <div class="noise" aria-hidden="true"></div>
  ${navHtml()}

  <main class="cs-page" id="top">
    <div class="cs-wrap">
      <nav class="cs-breadcrumb mono" aria-label="Breadcrumb">
        <a href="/#work">Work</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${esc(c.short)}</span>
      </nav>

      <header class="cs-hero cs-reveal">
        <span class="proj-badge ${meta.class} mono">${meta.badge}</span>
        <h1 class="cs-title">${esc(c.title)}</h1>
        <p class="cs-outcome">${esc(c.outcome)}</p>
        <ul class="cs-meta" aria-label="Project meta">
          <li class="cs-chip mono"><span>Role</span>${esc(c.role)}</li>
          <li class="cs-chip mono"><span>Tools</span>${esc(c.tools.slice(0, 3).join(" · "))}</li>
          <li class="cs-chip mono"><span>Year</span>${esc(c.year)}</li>
          <li class="cs-chip mono"><span>Type</span>${esc(c.type)}</li>
        </ul>
      </header>

      <figure class="cs-visual liquid-glass liquid-glass--card cs-reveal" data-accent="${meta.css}">
        <span class="lg-shine"></span>
        ${art}
      </figure>

      <section class="cs-overview cs-reveal"${draftAttr(c)}>
        <div class="cs-panel liquid-glass liquid-glass--tile">
          <span class="lg-shine"></span>
          <h2>The brief</h2>
          ${briefBody}
        </div>
        <div class="cs-panel liquid-glass liquid-glass--tile">
          <span class="lg-shine"></span>
          <h2>My role</h2>
          <p${draftClass(c) ? ' class="cs-draft-copy"' + draftAttr(c) : ""}>${esc(c.myRole)}</p>
        </div>
      </section>

      <section class="cs-process cs-reveal">
        <h2>Process</h2>
        <ol class="cs-steps">
          ${c.process
            .map(
              (s) => `<li class="cs-step liquid-glass liquid-glass--tile">
            <span class="lg-shine"></span>
            <span class="cs-step-n mono">${s.n}</span>
            <h3>${esc(s.t)}</h3>
            <p${c.draft ? ' class="cs-draft-copy" data-draft="true"' : ""}>${esc(s.d)}</p>
          </li>`
            )
            .join("\n          ")}
        </ol>
      </section>

      ${proofBlock(c)}

      <section class="cs-result cs-reveal"${draftAttr(c)}>
        <h2>Result</h2>
        <p class="cs-result-copy${draftClass(c)}"${c.draft ? ' data-draft="true"' : ""}>${esc(c.result)}</p>
        <ul class="cs-stat-row">
          ${c.stats
            .map(
              (s) => `<li class="stat-tile liquid-glass liquid-glass--tile">
            <span class="lg-shine"></span>
            <span class="stat-tile-value">${esc(s.v)}</span>
            <span class="stat-tile-label">${esc(s.l)}</span>
          </li>`
            )
            .join("\n          ")}
        </ul>
      </section>

      <aside class="cs-next-banner liquid-glass liquid-glass--card cs-reveal">
        <span class="lg-shine"></span>
        <div>
          <p class="cs-next-label mono">Next project</p>
          <p class="cs-next-title">${esc(next.title)}</p>
        </div>
        <div class="cs-next-actions">
          <a class="cs-next-link" href="/work/${next.slug}.html">View case →</a>
          <a class="cs-all-link mono" href="/#work">← All work</a>
        </div>
      </aside>

      <p class="cs-cta-slim">
        Want results like this?
        <a href="/#contact">Start a project <span aria-hidden="true">→</span></a>
      </p>
    </div>
  </main>

  ${footerHtml()}
</body>
</html>
`;
}

mkdirSync(OUT, { recursive: true });
CASES.forEach((c, i) => {
  const next = CASES[(i + 1) % CASES.length];
  const html = renderCase(c, next);
  const path = resolve(OUT, `${c.slug}.html`);
  writeFileSync(path, html, "utf8");
  console.log("wrote", path);
});

console.log(`\nGenerated ${CASES.length} case pages.`);
