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
      setTimeout(tick, 40 + Math.random() * 70);
    } else {
      setTimeout(() => {
        loader.classList.add("done");
        document.body.style.overflow = "";
      }, 350);
    }
  };
  document.body.style.overflow = "hidden";
  tick();
})();

/* ============ TEXT SCRAMBLE (intro eyebrow) ============ */
const scrambleEl = document.querySelector("[data-scramble]");
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ█▀▄░§©®#¦";

function scramble(el) {
  const target = el.dataset.text || el.textContent;
  el.dataset.text = target;
  let frame = 0;
  const total = 34;
  const timer = setInterval(() => {
    frame++;
    const reveal = Math.floor((frame / total) * target.length);
    let out = "";
    for (let i = 0; i < target.length; i++) {
      if (i < reveal || target[i] === " " || target[i] === "\u00a0") {
        out += target[i];
      } else {
        out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
    }
    el.textContent = out;
    if (frame >= total) {
      clearInterval(timer);
      el.textContent = target;
    }
  }, 45);
}

if (scrambleEl) {
  scramble(scrambleEl);
  setInterval(() => scramble(scrambleEl), 9000);
}

/* ============ WORK LIST HOVER PREVIEW ============ */
const preview = document.querySelector("[data-work-preview]");
const previewImg = document.querySelector("[data-work-preview-img]");
const workItems = document.querySelectorAll("[data-work-item]");

if (preview && matchMedia("(pointer: fine)").matches) {
  let raf = null;
  let mouseX = 0;
  let mouseY = 0;

  const move = () => {
    preview.style.left = mouseX + 24 + "px";
    preview.style.top = mouseY - preview.offsetHeight / 2 + "px";
    raf = null;
  };

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!raf) raf = requestAnimationFrame(move);
  });

  workItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      previewImg.src = item.dataset.img;
      preview.classList.add("visible");
    });
    item.addEventListener("mouseleave", () => {
      preview.classList.remove("visible");
    });
  });
}

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
