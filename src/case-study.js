import "./styles/tokens.css";
import "../assets/css/style.css";
import "../assets/css/liquid-glass.css";
import "../assets/css/cursor.css";
import "./styles/case-study.css";
import "../assets/js/cursor.js";
import "../assets/js/logo-roles.js";
import "../assets/js/footer-fx.js";

/* Case pages: no boot intro — ever */
document.documentElement.classList.add("intro-done", "intro-skip");

/* Slim nav: drawer + glass pill (no scroll-spy sections on case pages) */
(function initCaseNav() {
  const nav = document.querySelector("[data-nav]");
  const burger = document.querySelector("[data-burger]");
  const drawer = document.querySelector("[data-nav-drawer]");
  const desktop = document.querySelector("[data-nav-desktop]");
  const pill = document.querySelector("[data-nav-pill]");
  const links = desktop ? [...desktop.querySelectorAll("[data-nav-link]")] : [];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PILL_BASE = 100;

  if (burger && drawer) {
    const setOpen = (open) => {
      drawer.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    burger.addEventListener("click", () => setOpen(!drawer.classList.contains("is-open")));
    drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  if (!nav || !pill || !links.length) return;

  const workLink = links.find((a) => a.dataset.section === "work") || links[0];
  let activeLink = workLink;
  let hovering = false;

  const movePillTo = (link, instant) => {
    if (!pill || !desktop || !link) return;
    const navRect = desktop.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const x = linkRect.left - navRect.left;
    const scaleX = Math.max(linkRect.width, 1) / PILL_BASE;
    if (instant || reduceMotion) pill.style.transition = "none";
    pill.style.transform = `translate3d(${x}px, -50%, 0) scaleX(${scaleX})`;
    pill.classList.add("is-ready");
    if (instant || reduceMotion) {
      void pill.offsetWidth;
      pill.style.transition = "";
    }
  };

  links.forEach((a) => a.classList.toggle("is-active", a === workLink));
  requestAnimationFrame(() => movePillTo(workLink, true));

  links.forEach((link) => {
    link.addEventListener("mouseenter", () => {
      hovering = true;
      movePillTo(link, false);
    });
  });
  desktop.addEventListener("mouseleave", () => {
    hovering = false;
    movePillTo(activeLink, false);
  });

  addEventListener("resize", () => movePillTo(activeLink, true), { passive: true });
})();

/* Scroll-in reveals */
(function initReveals() {
  const nodes = [...document.querySelectorAll(".cs-reveal")];
  if (!nodes.length) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach((n) => n.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  nodes.forEach((n) => io.observe(n));
})();
