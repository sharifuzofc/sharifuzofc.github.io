"use strict";

/* ============ MOBILE NAV ============ */
const burger = document.querySelector("[data-burger]");
const nav = document.querySelector("[data-nav]");

if (burger && nav) {
  burger.addEventListener("click", () => nav.classList.toggle("open"));
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

/* ============ BACK TO TOP ============ */
document.querySelectorAll("[data-back-to-top]").forEach((btn) =>
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  )
);

/* ============ CONTACT FORM (mailto) ============ */
const mailForm = document.querySelector("[data-mail-form]");
if (mailForm) {
  mailForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(mailForm);
    const subject = `Portfolio contact from ${data.get("name")}`;
    const body = `${data.get("message")}\n\n— ${data.get("name")} (${data.get("email")})`;
    window.location.href =
      "mailto:sharifuzofc@gmail.com?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);
  });
}
