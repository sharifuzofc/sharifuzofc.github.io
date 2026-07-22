"use strict";

/* ============ PRELOADER ============ */
const preloader = document.querySelector("[data-preloader]");
const preCount = document.querySelector("[data-pre-count]");

if (preloader && preCount) {
  document.body.style.overflow = "hidden";
  let n = 0;
  const tick = () => {
    n = Math.min(100, n + Math.ceil(Math.random() * 9));
    preCount.textContent = n;
    if (n < 100) {
      setTimeout(tick, 55);
    } else {
      setTimeout(() => {
        preloader.classList.add("done");
        document.body.style.overflow = "";
        startHero();
      }, 350);
    }
  };
  tick();
} else {
  startHero();
}

/* ============ HERO LETTER SPLIT ============ */
function startHero() {
  document.querySelectorAll("[data-split]").forEach((el, wordIdx) => {
    const text = el.textContent;
    el.textContent = "";
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.style.setProperty("--i", i);
      s.style.setProperty("--d", wordIdx * 220 + "ms");
      s.textContent = ch;
      el.appendChild(s);
    });
  });
}

/* ============ ROLES ROTATOR ============ */
const rolesWrap = document.querySelector("[data-roles]");
if (rolesWrap) {
  const items = rolesWrap.children.length;
  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % items;
    [...rolesWrap.children].forEach(
      (el) => (el.style.transform = `translateY(-${idx * 1.6}em)`)
    );
  }, 2200);
}

/* ============ LOCAL TIME (DHAKA) ============ */
const timeEl = document.querySelector("[data-local-time]");
if (timeEl) {
  const renderTime = () => {
    const t = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Dhaka",
    }).format(new Date());
    timeEl.textContent = `Dhaka ${t}`;
  };
  renderTime();
  setInterval(renderTime, 30000);
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
  { threshold: 0.14 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ============ SERVICES ACCORDION ============ */
document.querySelectorAll("[data-svc]").forEach((svc) => {
  const head = svc.querySelector(".svc-head");
  const body = svc.querySelector(".svc-body");
  head.addEventListener("click", () => {
    const isOpen = svc.classList.contains("open");
    document.querySelectorAll("[data-svc].open").forEach((o) => {
      o.classList.remove("open");
      o.querySelector(".svc-body").style.maxHeight = "0px";
      o.querySelector(".svc-head").setAttribute("aria-expanded", "false");
    });
    if (!isOpen) {
      svc.classList.add("open");
      body.style.maxHeight = body.scrollHeight + "px";
      head.setAttribute("aria-expanded", "true");
    }
  });
});

/* ============ STAT COUNT-UP ============ */
const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.count;
      const t0 = performance.now();
      const dur = 1400;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countObserver.unobserve(el);
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll("[data-count]").forEach((el) => countObserver.observe(el));

/* ============ CUSTOM CURSOR ============ */
const cursor = document.querySelector("[data-cursor]");
if (cursor && matchMedia("(hover: hover)").matches) {
  let cx = -100, cy = -100, tx = -100, ty = -100;
  addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
    cursor.classList.add("on");
  });
  const loop = () => {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  };
  loop();
  document.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("grow"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("grow"));
  });
}

/* ============ BACK TO TOP ============ */
document.querySelectorAll("[data-back-to-top]").forEach((btn) =>
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  )
);
