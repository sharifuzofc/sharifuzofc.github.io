"use strict";

/**
 * Section bubble strips — calm drifting foam + pointer repulsion.
 * One shared rAF updates only viewport-visible strips (IO-gated).
 * Bubbles = pooled divs (CSS glass recipe matches cursor trail; avoids
 * per-frame gradient redraw that a canvas approach would need).
 */
(function initBubbleStrips() {
  const roots = [...document.querySelectorAll("[data-bubble-strip]")];
  if (!roots.length) return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const mobileMq = matchMedia("(max-width: 767px)");
  const TINT_POOL = ["green", "violet", "orange"];

  const REPEL_R = 90;
  const REPEL_R2 = REPEL_R * REPEL_R;
  const REPEL_MAX = 40;
  const PUSH_LERP = 0.16;
  const STRIP_H = 64;

  const pointer = { x: 0, y: 0, on: false };
  let rafId = 0;
  let lastT = 0;
  let moveRaf = 0;
  let geometryDirty = true;

  /** @type {{ el: HTMLElement, bubbles: any[], visible: boolean, w: number, h: number, left: number, top: number }[]} */
  const strips = [];

  function countForViewport() {
    if (mobileMq.matches) return 14;
    return 22 + ((Math.random() * 9) | 0); /* 22–30 */
  }

  function makeBubble(stripEl, w, h) {
    const size = 3 + Math.random() * 7; /* 3–10px */
    const tint =
      Math.random() < 0.2
        ? TINT_POOL[(Math.random() * TINT_POOL.length) | 0]
        : "cyan";
    const el = document.createElement("div");
    el.className = `sb-bubble sb-bubble--${tint}`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    stripEl.appendChild(el);

    const period = 6 + Math.random() * 6; /* 6–12s */
    return {
      el,
      size,
      half: size * 0.5,
      /* Anchor in strip local space */
      ax: Math.random() * w,
      ay: Math.random() * h,
      ampX: 3 + Math.random() * 3, /* ±6px peak */
      ampY: 3 + Math.random() * 3,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      omegaX: (Math.PI * 2) / period,
      omegaY: (Math.PI * 2) / (period * (0.85 + Math.random() * 0.3)),
      rise: 4 + Math.random() * 10, /* px/s upward bias */
      pushX: 0,
      pushY: 0,
      /* Prebuilt transform buffer pieces — avoid object alloc in tick */
      _tx: 0,
      _ty: 0,
    };
  }

  function stripHeight(el) {
    return Math.max(el.clientHeight || el.getBoundingClientRect().height || STRIP_H, 1);
  }

  function measure(strip) {
    const r = strip.el.getBoundingClientRect();
    strip.w = r.width || strip.el.clientWidth || 320;
    strip.h = stripHeight(strip.el);
    strip.left = r.left;
    strip.top = r.top;
  }

  function paintStatic(strip) {
    const { bubbles } = strip;
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      const x = b.ax - b.half;
      const y = b.ay - b.half;
      b.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    }
  }

  function buildStrip(el) {
    el.replaceChildren();
    const w = Math.max(el.clientWidth || el.getBoundingClientRect().width || 0, 1);
    const h = stripHeight(el);
    const n = countForViewport();
    const bubbles = new Array(n);
    for (let i = 0; i < n; i++) bubbles[i] = makeBubble(el, w, h);
    const strip = {
      el,
      bubbles,
      visible: false,
      w,
      h,
      left: 0,
      top: 0,
    };
    measure(strip);
    if (reduceMotion) paintStatic(strip);
    return strip;
  }

  roots.forEach((el) => {
    strips.push(buildStrip(el));
  });

  function anyVisible() {
    for (let i = 0; i < strips.length; i++) {
      if (strips[i].visible) return true;
    }
    return false;
  }

  function ensureLoop() {
    if (reduceMotion) return;
    if (!rafId && anyVisible()) {
      lastT = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  }

  function syncGeometry() {
    if (!geometryDirty) return;
    for (let i = 0; i < strips.length; i++) {
      if (strips[i].visible) measure(strips[i]);
    }
    geometryDirty = false;
  }

  function updateStrip(strip, t, dt) {
    const { bubbles, w, h, left, top } = strip;
    const px = pointer.x - left;
    const py = pointer.y - top;
    const canRepel = finePointer.matches && pointer.on;

    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];

      /* Upward bias + wrap (staggered via per-bubble rise rate) */
      b.ay -= b.rise * dt;
      if (b.ay < -b.size) b.ay = h + b.size;

      const driftX = Math.sin(t * b.omegaX + b.phaseX) * b.ampX;
      const driftY = Math.sin(t * b.omegaY + b.phaseY) * b.ampY;

      let tx = 0;
      let ty = 0;
      if (canRepel) {
        const cx = b.ax + driftX;
        const cy = b.ay + driftY;
        const dx = cx - px;
        const dy = cy - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < REPEL_R2 && d2 > 0.25) {
          const d = Math.sqrt(d2);
          const fall = 1 - d / REPEL_R;
          /* Squared falloff ≈ inverse-square soft rim */
          const mag = REPEL_MAX * fall * fall;
          tx = (dx / d) * mag;
          ty = (dy / d) * mag;
        }
      }
      b.pushX += (tx - b.pushX) * PUSH_LERP;
      b.pushY += (ty - b.pushY) * PUSH_LERP;

      /* Keep soft horizontal wrap inside strip */
      let x = b.ax + driftX + b.pushX;
      if (x < -b.size) x += w + b.size * 2;
      else if (x > w + b.size) x -= w + b.size * 2;
      const y = b.ay + driftY + b.pushY;

      b.el.style.transform = `translate3d(${(x - b.half).toFixed(2)}px, ${(y - b.half).toFixed(2)}px, 0)`;
    }
  }

  function tick(now) {
    rafId = 0;
    if (reduceMotion || !anyVisible()) {
      lastT = now;
      return;
    }
    const dt = Math.min(0.05, (now - lastT) / 1000) || 0.016;
    lastT = now;
    const t = now * 0.001;
    syncGeometry();

    for (let i = 0; i < strips.length; i++) {
      if (strips[i].visible) updateStrip(strips[i], t, dt);
    }

    if (anyVisible()) rafId = requestAnimationFrame(tick);
  }

  const stripByEl = new Map();
  strips.forEach((s) => stripByEl.set(s.el, s));

  const io = new IntersectionObserver(
    (entries) => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const strip = stripByEl.get(entry.target);
        if (!strip) continue;
        strip.visible = entry.isIntersecting && entry.intersectionRatio > 0;
        if (strip.visible) geometryDirty = true;
      }
      if (anyVisible()) ensureLoop();
      else if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    },
    { root: null, rootMargin: "40px 0px", threshold: 0 }
  );

  strips.forEach((s) => io.observe(s.el));

  if (!reduceMotion) {
    addEventListener(
      "pointermove",
      (e) => {
        if (!finePointer.matches) return;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.on = true;
        if (moveRaf) return;
        moveRaf = requestAnimationFrame(() => {
          moveRaf = 0;
        });
        ensureLoop();
      },
      { passive: true }
    );

    addEventListener(
      "scroll",
      () => {
        geometryDirty = true;
      },
      { passive: true }
    );

    document.documentElement.addEventListener("mouseleave", () => {
      pointer.on = false;
    });
    document.documentElement.addEventListener("mouseenter", () => {
      pointer.on = true;
    });
  }

  let resizeT = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      /* Rebuild counts/layout on breakpoint change */
      for (let i = 0; i < strips.length; i++) {
        const wasVisible = strips[i].visible;
        const el = strips[i].el;
        io.unobserve(el);
        stripByEl.delete(el);
        strips[i] = buildStrip(el);
        strips[i].visible = wasVisible;
        stripByEl.set(el, strips[i]);
        io.observe(el);
        if (reduceMotion) paintStatic(strips[i]);
      }
      geometryDirty = true;
      ensureLoop();
    }, 120);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    } else {
      ensureLoop();
    }
  });

  /* Kick if any already in view (e.g. hero) */
  requestAnimationFrame(() => {
    strips.forEach((s) => {
      const r = s.el.getBoundingClientRect();
      s.visible = r.bottom > 0 && r.top < innerHeight;
      if (s.visible) measure(s);
    });
    ensureLoop();
  });
})();
