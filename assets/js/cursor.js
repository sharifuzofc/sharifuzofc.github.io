"use strict";

/**
 * Premium two-layer custom cursor
 * — fine pointer only; disabled on touch / coarse pointers
 */
(function initCustomCursor() {
  const fineMq = matchMedia("(hover: hover) and (pointer: fine)");
  const noHoverMq = matchMedia("(hover: none)");
  if (!fineMq.matches || noHoverMq.matches) return;

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

  const trail = document.createElement("canvas");
  trail.className = "c-cursor-trail";
  trail.setAttribute("aria-hidden", "true");
  document.body.appendChild(trail);
  const tctx = trail.getContext("2d");

  /* ---------- State ---------- */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { x: mouse.x, y: mouse.y };
  let mode = "default"; // default | hover | view | invert | rotate
  let visible = false;
  let clicking = false;
  let inHero = false;
  let rafId = 0;
  let magneticEl = null;
  const labelEl = cursor.querySelector(".c-cursor__label");

  const RING_LERP = reduceMotion ? 1 : 0.15;
  const TRAIL_MAX = 14;
  const trailPts = [];

  const hoverSel =
    "a, button, .btn-sky, .btn-ghost, .f-btn, .nav-hire, .nav-burger, .to-top, .contact-mail, summary, [role='button']";
  const viewSel =
    ".proj-card, .proj-thumb, .proj-thumb img, .flagship, .flagship-chrome, .flagship-poster";
  const invertSel =
    ".hero-name, .big-title, .footer-title, .contact-left > h2";
  const rotateSel = ".mini-3d.is-interactive-3d, .mini-3d.is-interactive-3d canvas";
  const magneticSel =
    "a.btn-sky, a.btn-ghost, a.btn-primary, a.btn-secondary, a.nav-hire, button, .f-btn, .nav-desktop a, .nav-drawer a, .nav-logo, .contact-mail, .to-top";

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

    // Magnetic pull on buttons / links (not project VIEW cards / 3D canvases)
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

  /* ---------- Trail (hero only) ---------- */
  function sizeTrail() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    trail.width = Math.floor(innerWidth * dpr);
    trail.height = Math.floor(innerHeight * dpr);
    trail.style.width = innerWidth + "px";
    trail.style.height = innerHeight + "px";
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawTrail() {
    if (reduceMotion || !tctx) return;
    tctx.clearRect(0, 0, innerWidth, innerHeight);
    if (!inHero || trailPts.length < 2) {
      trail.classList.toggle("is-on", false);
      return;
    }
    trail.classList.add("is-on");
    for (let i = 0; i < trailPts.length; i++) {
      const p = trailPts[i];
      const t = i / (trailPts.length - 1 || 1);
      const alpha = t * 0.22;
      const r = 2 + t * 10;
      tctx.beginPath();
      tctx.fillStyle = `rgba(56, 189, 248, ${alpha.toFixed(3)})`;
      tctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      tctx.fill();
    }
  }

  /* ---------- Events ---------- */
  let moveRaf = 0;
  let lastTarget = null;
  const heroEl = document.getElementById("home");

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
        resolveTarget(lastTarget);

        if (heroEl) {
          const r = heroEl.getBoundingClientRect();
          inHero =
            mouse.y >= r.top &&
            mouse.y <= r.bottom &&
            mouse.x >= r.left &&
            mouse.x <= r.right;
        } else {
          inHero = false;
        }

        if (inHero && !reduceMotion) {
          trailPts.push({ x: mouse.x, y: mouse.y });
          if (trailPts.length > TRAIL_MAX) trailPts.shift();
        } else if (trailPts.length) {
          trailPts.length = 0;
        }

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
      // reflow to restart animation
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
    trailPts.length = 0;
  });

  document.documentElement.addEventListener("mouseenter", () => {
    visible = true;
    cursor.classList.add("is-visible");
  });

  addEventListener("resize", sizeTrail);

  /* ---------- RAF loop ---------- */
  function tick() {
    // Instant inner dot
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

    drawTrail();
    rafId = requestAnimationFrame(tick);
  }

  sizeTrail();
  rafId = requestAnimationFrame(tick);

  // Safety: if coarse / touch pointer appears later (tablet hybrid), tear down
  const onChange = () => {
    if (!fineMq.matches || noHoverMq.matches) {
      cancelAnimationFrame(rafId);
      if (moveRaf) cancelAnimationFrame(moveRaf);
      root.classList.remove("has-custom-cursor", "is-reduced-cursor");
      cursor.remove();
      trail.remove();
      fineMq.removeEventListener("change", onChange);
      noHoverMq.removeEventListener("change", onChange);
    }
  };
  fineMq.addEventListener("change", onChange);
  noHoverMq.addEventListener("change", onChange);
})();
