"use strict";

/* ============ MOBILE NAV ============ */
const burger = document.querySelector("[data-burger]");
const nav = document.querySelector("[data-nav]");

if (burger) {
  burger.addEventListener("click", () => nav.classList.toggle("open"));
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => nav.classList.remove("open"))
  );
}

/* ============ ACTIVE NAV LINK ============ */
const navLinks = document.querySelectorAll("[data-nav-link]");
const sections = [...navLinks]
  .map((l) => document.querySelector(l.getAttribute("href")))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((l) =>
        l.classList.toggle(
          "active",
          l.getAttribute("href") === "#" + entry.target.id
        )
      );
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
sections.forEach((s) => sectionObserver.observe(s));

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

/* ============ BACK TO TOP ============ */
const backToTop = document.querySelector("[data-back-to-top]");
if (backToTop) {
  backToTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
}
