"use strict";

/* ============ LOADER / WELCOME ============ */
const loader = document.querySelector("[data-loader]");
const loaderWord = document.querySelector("[data-loader-word]");

(function runWelcome() {
  const WORDS = ["WELCOME", "TO", "SHARIFUZ", "ZAMAN"];
  const WORD_TIME = 620;   // how long each word stays
  const FLICKER = 75;      // per-letter font flicker speed
  let wordIdx = 0;
  let flickerTimer = null;

  document.body.style.overflow = "hidden";

  const setWord = (word) => {
    loaderWord.innerHTML = "";
    [...word].forEach((letter) => {
      const span = document.createElement("span");
      span.className = "ch";
      span.textContent = letter === " " ? "\u00a0" : letter;
      loaderWord.appendChild(span);
    });
  };

  // randomly flip each letter between serif / bold sans / italic
  const flicker = () => {
    loaderWord.querySelectorAll(".ch").forEach((span) => {
      span.classList.remove("alt", "ital", "thin");
      const roll = Math.random();
      if (roll < 0.22) span.classList.add("alt");
      else if (roll < 0.38) span.classList.add("ital");
      else span.classList.add("thin");
    });
  };

  const next = () => {
    if (wordIdx >= WORDS.length) {
      clearInterval(flickerTimer);
      // settle on the final name, clean serif, brief pause, then reveal site
      loaderWord.classList.add("small");
      setWord("SHARIFUZ ZAMAN");
      setTimeout(() => {
        loader.classList.add("done");
        document.body.style.overflow = "";
      }, 650);
      return;
    }
    setWord(WORDS[wordIdx]);
    flicker();
    wordIdx++;
    setTimeout(next, WORD_TIME);
  };

  flickerTimer = setInterval(flicker, FLICKER);
  next();
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
