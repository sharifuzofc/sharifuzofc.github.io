import "./styles/tokens.css";
import "../assets/css/nav-mobile.css";
import "../assets/css/style.css";
import "../assets/css/liquid-glass.css";
import "../assets/css/cursor.css";
import "../assets/css/not-found.css";
import "./styles/case-study.css";
import "../assets/js/canary.js";
import "../assets/js/cursor.js";
import "../assets/js/srf-mark.js";
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
  let menuOpen = false;
  let openTimer = 0;

  const closeBtn = drawer?.querySelector("[data-menu-close]");

  const focusables = () => {
    if (!drawer) return [];
    return [
      ...drawer.querySelectorAll(
        'a[href], button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
      ),
    ].filter((el) => el.offsetParent !== null);
  };

  const setOpen = (open) => {
    if (!burger || !drawer || open === menuOpen) return;
    menuOpen = open;
    clearTimeout(openTimer);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", "Menu");
    document.documentElement.classList.toggle("menu-open", open);
    if (open) {
      drawer.hidden = false;
      void drawer.offsetWidth;
      drawer.classList.add("is-open");
      if (!reduceMotion) {
        burger.classList.add("is-opening");
        openTimer = window.setTimeout(() => burger.classList.remove("is-opening"), 380);
      }
      window.setTimeout(() => {
        const target = closeBtn || focusables()[0];
        target?.focus({ preventScroll: true, focusVisible: false });
      }, reduceMotion ? 0 : 80);
    } else {
      drawer.classList.remove("is-open");
      burger.classList.remove("is-opening");
      const hide = () => {
        if (!menuOpen) drawer.hidden = true;
      };
      if (reduceMotion) hide();
      else openTimer = window.setTimeout(hide, 380);
      burger.focus({ preventScroll: true });
    }
  };

  if (burger && drawer) {
    let pressTimer = 0;
    burger.addEventListener("click", () => {
      const willOpen = !menuOpen;
      if (reduceMotion) {
        setOpen(willOpen);
        return;
      }
      clearTimeout(pressTimer);
      burger.classList.add("is-pressing");
      if (willOpen) burger.classList.add("is-rim-flash");
      pressTimer = window.setTimeout(() => {
        burger.classList.remove("is-pressing");
        setOpen(willOpen);
        if (willOpen) {
          window.setTimeout(() => burger.classList.remove("is-rim-flash"), 400);
        }
      }, 90);
    });
    drawer.querySelectorAll("[data-drawer-close]").forEach((el) =>
      el.addEventListener("click", () => setOpen(false))
    );
    drawer.querySelectorAll("[data-drawer-link]").forEach((a) =>
      a.addEventListener("click", () => setOpen(false))
    );
    addEventListener("keydown", (e) => {
      if (!menuOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    });
    matchMedia("(min-width: 900px)").addEventListener?.("change", (e) => {
      if (e.matches) setOpen(false);
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
