"use strict";

/* ============ LOADER ============ */
const loader = document.querySelector("[data-loader]");
const loaderCount = document.querySelector("[data-loader-count]");

(function runLoader() {
  let n = 0;
  const tick = () => {
    n = Math.min(100, n + Math.ceil(Math.random() * 9));
    loaderCount.textContent = n;
    if (n < 100) {
      setTimeout(tick, 35 + Math.random() * 60);
    } else {
      setTimeout(() => {
        loader.classList.add("done");
        document.body.style.overflow = "";
      }, 300);
    }
  };
  document.body.style.overflow = "hidden";
  tick();
})();

/* ============ WORK: TV SCREEN HOVER ============ */
const tvScreen = document.querySelector("[data-tv-screen]");
const tvImg = document.querySelector("[data-tv-img]");
const workMeta = document.querySelector("[data-work-meta]");
const workItems = document.querySelectorAll("[data-work-item]");

workItems.forEach((item) => {
  item.addEventListener("mouseenter", () => {
    tvImg.src = item.dataset.img;
    tvScreen.classList.add("on");
    workMeta.innerHTML = item.dataset.meta;
    workMeta.classList.add("visible");
  });
  item.addEventListener("mouseleave", () => {
    tvScreen.classList.remove("on");
    workMeta.classList.remove("visible");
  });
  // touch devices: tap toggles the TV
  item.addEventListener("touchstart", () => {
    tvImg.src = item.dataset.img;
    tvScreen.classList.add("on");
    workMeta.innerHTML = item.dataset.meta;
    workMeta.classList.add("visible");
  }, { passive: true });
});

/* ============ NAV ACTIVE STATE ============ */
const navLinks = document.querySelectorAll("[data-nav-link]");
const sections = [...navLinks].map((l) =>
  document.querySelector(l.getAttribute("href"))
);

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

sections.forEach((s) => s && sectionObserver.observe(s));

/* ============ FAQ: only one open at a time ============ */
const faqItems = document.querySelectorAll(".faq-item");
faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    faqItems.forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

/* ============ BACK TO TOP / CHILL BUTTON ============ */
const backToTop = document.querySelector("[data-back-to-top]");
if (backToTop) {
  backToTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
}

const chillBtn = document.querySelector("[data-chill]");
if (chillBtn) {
  chillBtn.addEventListener("click", () => {
    chillBtn.textContent = "GOOD. I'M WATCHING YOU.";
  });
}

/* ============ HIDDEN SECTION (press "h") ============ */
const hiddenSection = document.querySelector("[data-hidden-section]");
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "h" && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const tag = document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    hiddenSection.classList.add("revealed");
    hiddenSection.scrollIntoView({ behavior: "smooth" });
  }
});
