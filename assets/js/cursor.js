"use strict";

/**
 * Premium two-layer custom cursor + foam bubble trail
 * — fine pointer only; disabled on touch / coarse pointers / reduced-motion
 */
(function initCustomCursor() {
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!canHover) return;

  const fineMq = matchMedia("(hover: hover) and (pointer: fine)");
  const noHoverMq = matchMedia("(hover: none)");
  const coarseMq = matchMedia("(pointer: coarse)");

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  root.classList.add("has-custom-cursor");
  if (reduceMotion) root.classList.add("is-reduced-cursor");

  /* ---------- DOM ---------- */
  const cursor = document.createElement("div");
  cursor.className = "c-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML =
    '<div class="c-cursor__dot"></div>' +
    '<div class="c-cursor__ring"><span class="c-cursor__label">VIEW</span></div>' +
    '<div class="c-cursor__ripple"></div>';
  document.body.appendChild(cursor);

  const dot = cursor.querySelector(".c-cursor__dot");
  const ring = cursor.querySelector(".c-cursor__ring");
  const ripple = cursor.querySelector(".c-cursor__ripple");

  /* Bubble layer — under header (z:100), under cursor (z:10000) */
  const bubbleLayer = document.createElement("div");
  bubbleLayer.className = "c-bubbles";
  bubbleLayer.setAttribute("aria-hidden", "true");
  document.body.appendChild(bubbleLayer);

  /* ---------- State ---------- */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { x: mouse.x, y: mouse.y };
  let mode = "default"; // default | hover | view | invert | rotate
  let visible = false;
  let clicking = false;
  let rafId = 0;
  let magneticEl = null;
  const labelEl = cursor.querySelector(".c-cursor__label");

  const RING_LERP = reduceMotion ? 1 : 0.15;

  const hoverSel =
    "a, button, .btn-sky, .btn-ghost, .f-btn, .nav-hire, .nav-burger, .contact-chip, .contact-submit, .contact-type-pill, summary, [role='button']";
  const viewSel =
    ".proj-card, .proj-thumb, .proj-thumb img, .flagship, .flagship-chrome, .flagship-poster";
  const invertSel =
    ".hero-name, .big-title, .footer-title, .contact-left > h2";
  const rotateSel = ".mini-3d.is-interactive-3d, .mini-3d.is-interactive-3d canvas";
  const magneticSel =
    "a.btn-sky, a.btn-ghost, a.btn-primary, a.btn-secondary, a.nav-hire, button, .f-btn, .nav-desktop a, .nav-drawer a, .srf-mark, .contact-chip, .contact-submit, .footer-top-chip";
  /* Pause foam over interactive UI (incl. discipline switcher) */
  const bubblePauseSel =
    hoverSel +
    ", " +
    viewSel +
    ", " +
    rotateSel +
    ", [data-hero-switcher], .hero-switcher-track, .hero-switcher-seg, [role='tab'], [data-marquee]";

  function closest(el, sel) {
    return el && el.closest ? el.closest(sel) : null;
  }

  function isTextField(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function setMode(next) {
    if (mode === next) return;
    mode = next;
    cursor.classList.toggle("is-hover", next === "hover");
    cursor.classList.toggle("is-view", next === "view");
    cursor.classList.toggle("is-invert", next === "invert");
    cursor.classList.toggle("is-rotate", next === "rotate");
    if (labelEl) {
      labelEl.textContent = next === "rotate" ? "⟳" : "VIEW";
    }
  }

  function resolveTarget(el) {
    if (isTextField(el)) {
      setMode("default");
      cursor.classList.add("is-field");
      if (magneticEl) {
        clearMagnetic(magneticEl);
        magneticEl = null;
      }
      return;
    }
    cursor.classList.remove("is-field");

    if (closest(el, invertSel)) setMode("invert");
    else if (closest(el, rotateSel)) setMode("rotate");
    else if (closest(el, viewSel)) setMode("view");
    else if (closest(el, hoverSel)) setMode("hover");
    else setMode("default");

    const mag = closest(el, magneticSel);
    if (mag !== magneticEl) {
      if (magneticEl) clearMagnetic(magneticEl);
      magneticEl = mag && !closest(el, viewSel) && !closest(el, rotateSel) ? mag : null;
      if (magneticEl) magneticEl.classList.add("c-magnetic");
    }
  }

  function clearMagnetic(el) {
    if (!el) return;
    el.classList.remove("is-pulled");
    el.style.transform = "translate3d(0, 0, 0)";
    setTimeout(() => {
      if (magneticEl !== el) {
        el.style.transform = "";
        el.classList.remove("c-magnetic");
      }
    }, 380);
  }

  function updateMagnetic() {
    if (!magneticEl || reduceMotion) return;
    const r = magneticEl.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mouse.x - cx;
    const dy = mouse.y - cy;
    const pull = 0.22;
    const max = 10;
    const mx = Math.max(-max, Math.min(max, dx * pull));
    const my = Math.max(-max, Math.min(max, dy * pull));
    magneticEl.classList.add("is-pulled", "c-magnetic");
    magneticEl.style.transform =
      `translate3d(${mx.toFixed(2)}px, ${my.toFixed(2)}px, 0)`;
  }

  /* ============================================================
     Foam bubble trail — pooled nodes, WAAPI only, sleeps when idle
     ============================================================ */
  const POOL_SIZE = 18;
  const VEL_MIN = 36; /* px/s — still cursor emits nothing */
  const VEL_FAST = 1300; /* px/s → max emission */
  const RATE_MIN = 2.5; /* bubbles/sec slow drag */
  const RATE_MAX = 11; /* bubbles/sec fast sweep */
  const TINTS = ["green", "violet", "orange"];

  const pool = [];
  const free = [];
  let liveCount = 0;
  let emitAcc = 0;
  let lastSampleX = mouse.x;
  let lastSampleY = mouse.y;
  let lastSampleT = 0;
  let bubblesArmed = false;
  let bubblesPaused = false;

  if (!reduceMotion) {
    for (let i = 0; i < POOL_SIZE; i++) {
      const el = document.createElement("div");
      el.className = "c-bubble";
      el.style.opacity = "0";
      bubbleLayer.appendChild(el);
      const item = { el, anim: null, busy: false };
      pool.push(item);
      free.push(item);
    }
  }

  function introCleared() {
    return (
      root.classList.contains("intro-done") ||
      root.classList.contains("intro-skip") ||
      !document.getElementById("intro")
    );
  }

  function armBubbles() {
    bubblesArmed = !reduceMotion && introCleared();
  }

  armBubbles();
  if (!bubblesArmed && !reduceMotion) {
    document.addEventListener(
      "intro:done",
      () => {
        armBubbles();
      },
      { once: true }
    );
  }

  function releaseBubble(item) {
    if (!item.busy) return;
    item.busy = false;
    const anim = item.anim;
    item.anim = null;
    if (anim) {
      anim.onfinish = null;
      anim.oncancel = null;
      try {
        anim.cancel();
      } catch (_) {
        /* already finished */
      }
    }
    item.el.style.opacity = "0";
    item.el.style.transform = "translate3d(-100px,-100px,0)";
    free.push(item);
    liveCount = Math.max(0, liveCount - 1);
  }

  function clearBubbles() {
    emitAcc = 0;
    for (let i = 0; i < pool.length; i++) {
      const item = pool[i];
      if (item.busy) releaseBubble(item);
    }
    liveCount = 0;
    free.length = 0;
    for (let i = 0; i < pool.length; i++) free.push(pool[i]);
  }

  function spawnBubble() {
    if (!free.length || liveCount >= POOL_SIZE) return;
    const item = free.pop();
    item.busy = true;
    liveCount++;

    const el = item.el;
    const size = 3 + Math.random() * 4; /* 3–7px */
    const ox = mouse.x + (Math.random() - 0.5) * 12; /* ±6px */
    const oy = mouse.y + (Math.random() - 0.5) * 12;
    const half = size * 0.5;
    const drift = 14 + Math.random() * 12; /* 14–26px up */
    const sway = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 5);
    const dur = 700 + Math.random() * 400; /* 700–1100ms */
    const tint = Math.random() < 0.15 ? TINTS[(Math.random() * TINTS.length) | 0] : "cyan";

    el.className = `c-bubble c-bubble--${tint}`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    const x0 = ox - half;
    const y0 = oy - half;

    /* Soft sin-ish sway via 4 keyframes — transform + opacity only */
    item.anim = el.animate(
      [
        {
          transform: `translate3d(${x0}px, ${y0}px, 0) scale(1)`,
          opacity: 0.72,
        },
        {
          transform: `translate3d(${x0 + sway}px, ${y0 - drift * 0.35}px, 0) scale(1.12)`,
          opacity: 0.55,
          offset: 0.32,
        },
        {
          transform: `translate3d(${x0 - sway * 0.55}px, ${y0 - drift * 0.7}px, 0) scale(1.22)`,
          opacity: 0.28,
          offset: 0.68,
        },
        {
          transform: `translate3d(${x0 + sway * 0.25}px, ${y0 - drift}px, 0) scale(1.3)`,
          opacity: 0,
        },
      ],
      {
        duration: dur,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      }
    );

    item.anim.onfinish = () => releaseBubble(item);
    item.anim.oncancel = () => {
      /* releaseBubble handles cancel path */
    };
  }

  function tickBubbles(dt, speed, overInteractive) {
    if (
      !bubblesArmed ||
      reduceMotion ||
      bubblesPaused ||
      document.hidden ||
      overInteractive ||
      mode === "hover" ||
      mode === "view" ||
      mode === "rotate"
    ) {
      emitAcc = 0;
      return;
    }

    if (speed < VEL_MIN) {
      emitAcc = 0;
      return;
    }

    const t = Math.min(1, (speed - VEL_MIN) / (VEL_FAST - VEL_MIN));
    const rate = RATE_MIN + t * (RATE_MAX - RATE_MIN);
    emitAcc += rate * dt;

    while (emitAcc >= 1 && liveCount < POOL_SIZE) {
      emitAcc -= 1;
      spawnBubble();
    }
    if (emitAcc > 2) emitAcc = 2; /* avoid burst after lag */
  }

  /* ---------- Events ---------- */
  let moveRaf = 0;
  let lastTarget = null;

  addEventListener(
    "pointermove",
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      lastTarget = e.target;
      if (!visible) {
        visible = true;
        cursor.classList.add("is-visible");
        ringPos.x = mouse.x;
        ringPos.y = mouse.y;
      }
      if (moveRaf) return;
      moveRaf = requestAnimationFrame(() => {
        moveRaf = 0;
        const now = performance.now();
        const dt = lastSampleT ? Math.min(0.05, (now - lastSampleT) / 1000) : 0.016;
        const dist = Math.hypot(mouse.x - lastSampleX, mouse.y - lastSampleY);
        const speed = dt > 0 ? dist / dt : 0;
        lastSampleX = mouse.x;
        lastSampleY = mouse.y;
        lastSampleT = now;

        resolveTarget(lastTarget);
        const overInteractive = !!closest(lastTarget, bubblePauseSel);
        tickBubbles(dt, speed, overInteractive);
        updateMagnetic();
      });
    },
    { passive: true }
  );

  addEventListener("pointerdown", (e) => {
    if (isTextField(e.target)) return;
    clicking = true;
    cursor.classList.add("is-click");
    if (!reduceMotion && ripple) {
      ripple.classList.remove("is-on");
      void ripple.offsetWidth;
      ripple.style.setProperty("--px", mouse.x + "px");
      ripple.style.setProperty("--py", mouse.y + "px");
      ripple.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
      ripple.classList.add("is-on");
    }
  });

  addEventListener("pointerup", () => {
    clicking = false;
    cursor.classList.remove("is-click");
  });

  document.documentElement.addEventListener("mouseleave", () => {
    visible = false;
    cursor.classList.remove("is-visible");
    if (magneticEl) {
      clearMagnetic(magneticEl);
      magneticEl = null;
    }
    emitAcc = 0;
    lastSampleT = 0;
  });

  document.documentElement.addEventListener("mouseenter", () => {
    visible = true;
    cursor.classList.add("is-visible");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      bubblesPaused = true;
      clearBubbles();
      lastSampleT = 0;
    } else {
      bubblesPaused = false;
      armBubbles();
    }
  });

  /* ---------- RAF loop (dot/ring only — no bubble work when idle) ---------- */
  function tick() {
    const dotScale = clicking ? 0.4 : mode === "hover" ? 0.55 : mode === "view" ? 0.4 : 1;
    const ringScale = clicking ? 0.82 : 1;

    if (reduceMotion) {
      ringPos.x = mouse.x;
      ringPos.y = mouse.y;
    } else {
      ringPos.x += (mouse.x - ringPos.x) * RING_LERP;
      ringPos.y += (mouse.y - ringPos.y) * RING_LERP;
    }

    dot.style.transform =
      `translate3d(${mouse.x}px, ${mouse.y}px, 0) scale(${dotScale})`;
    ring.style.transform =
      `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) scale(${ringScale})`;

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  const teardown = () => {
    cancelAnimationFrame(rafId);
    if (moveRaf) cancelAnimationFrame(moveRaf);
    clearBubbles();
    if (magneticEl) {
      clearMagnetic(magneticEl);
      magneticEl = null;
    }
    root.classList.remove("has-custom-cursor", "is-reduced-cursor");
    cursor.remove();
    bubbleLayer.remove();
    fineMq.removeEventListener("change", onCapabilityChange);
    noHoverMq.removeEventListener("change", onCapabilityChange);
    coarseMq.removeEventListener("change", onCapabilityChange);
  };

  const onCapabilityChange = () => {
    const stillOk =
      fineMq.matches && !noHoverMq.matches && !coarseMq.matches;
    if (!stillOk) teardown();
  };
  fineMq.addEventListener("change", onCapabilityChange);
  noHoverMq.addEventListener("change", onCapabilityChange);
  coarseMq.addEventListener("change", onCapabilityChange);
})();
