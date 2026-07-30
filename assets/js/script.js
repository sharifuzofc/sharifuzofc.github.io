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
