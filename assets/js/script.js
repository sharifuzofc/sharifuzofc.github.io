"use strict";

/* ============ MOBILE NAV ============ */
const burger = document.querySelector("[data-burger]");
const navLinks = document.querySelector(".nav-links");
if (burger && navLinks) {
  burger.addEventListener("click", () => navLinks.classList.toggle("open"));
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => navLinks.classList.remove("open"))
  );
}

/* ============ HERO LETTER SPLIT ============ */
const heroName = document.querySelector("[data-hero-name]");
if (heroName) {
  const text = heroName.textContent.trim();
  heroName.setAttribute("aria-label", text.replace(/\u00a0/g, " "));
  heroName.textContent = "";
  [...text].forEach((ch, i) => {
    const span = document.createElement("span");
    span.className = "char" + (ch === " " || ch === "\u00a0" ? " space" : "");
    span.style.setProperty("--i", String(i));
    span.textContent = ch === " " ? "\u00a0" : ch;
    heroName.appendChild(span);
  });
}

/* ============ ROLE ROTATOR ============ */
const rolesWrap = document.querySelector("[data-roles]");
if (rolesWrap) {
  const roles = [...rolesWrap.querySelectorAll(".role")];
  let index = 0;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion && roles.length > 1) {
    setInterval(() => {
      const current = roles[index];
      current.classList.remove("is-active");
      current.classList.add("is-leave");
      index = (index + 1) % roles.length;
      const next = roles[index];
      next.classList.remove("is-leave");
      // force reflow so enter animation replays
      void next.offsetWidth;
      next.classList.add("is-active");
      setTimeout(() => current.classList.remove("is-leave"), 500);
    }, 2600);
  }
}

/* ============ REVEAL ON SCROLL ============ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ============ PROJECT FILTER ============ */
const filterBar = document.querySelector("[data-filter-bar]");
if (filterBar) {
  const buttons = filterBar.querySelectorAll(".f-btn");
  const projects = document.querySelectorAll("[data-projects] .proj");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      projects.forEach((p) => {
        const show = f === "all" || p.dataset.cat === f;
        p.classList.toggle("hidden", !show);
      });
    });
  });
}

/* ============ EXPERIENCE ACCORDION ============ */
document.querySelectorAll("[data-xp]").forEach((xp) => {
  const head = xp.querySelector(".xp-head");
  const body = xp.querySelector(".xp-body");
  head.addEventListener("click", () => {
    const isOpen = xp.classList.contains("open");
    document.querySelectorAll("[data-xp].open").forEach((o) => {
      o.classList.remove("open");
      o.querySelector(".xp-body").style.maxHeight = "0px";
      o.querySelector(".xp-head").setAttribute("aria-expanded", "false");
    });
    if (!isOpen) {
      xp.classList.add("open");
      body.style.maxHeight = body.scrollHeight + "px";
      head.setAttribute("aria-expanded", "true");
    }
  });
});

/* ============ STATS COUNT-UP ============ */
const stats = document.querySelectorAll("[data-count]");
if (stats.length) {
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.count) || 0;
        const start = performance.now();
        const dur = 1100;
        const step = (now) => {
          const p = Math.min(1, (now - start) / dur);
          el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        countObserver.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );
  stats.forEach((el) => countObserver.observe(el));
}

/* ============ BACK TO TOP ============ */
const toTop = document.querySelector("[data-back-to-top]");
if (toTop) {
  addEventListener("scroll", () =>
    toTop.classList.toggle("show", scrollY > 600)
  );
  toTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
}
