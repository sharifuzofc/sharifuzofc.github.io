"use strict";

/**
 * Keyword marquee — JS-driven track with grab / throw / auto-resume.
 * Infinite wrap on a 2× duplicated track (teleport at ±50%).
 */
(function initMarquee() {
  const root = document.querySelector("[data-marquee]") || document.querySelector(".marquee");
  if (!root) return;

  const track = root.querySelector(".marquee-track");
  const seq = root.querySelector(".marquee-seq");
  if (!track || !seq) return;

  const LOOP_MS = 40000;
  const HOVER_FACTOR = 0.5;
  const FRICTION = 0.95;
  const RESUME_LERP = 0.06;
  const THROW_MIN = 0.02;
  const DRAG_PX = 5;
  const AXIS_PX = 10;
  const HINT_MS = 2500;
  const HINT_FLAG = "marqueeDragHintSeen";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.classList.add("marquee--interactive");
  track.style.animation = "none";

  let half = 0;
  let autoSpeed = 0;
  let position = 0;
  let velocity = 0;
  let mode = "auto";
  let hovering = false;
  let pointerId = null;
  let axis = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastT = 0;
  let dragVel = 0;
  let dragged = false;
  let suppressClick = false;
  let lastFrame = 0;
  let raf = 0;
  let hintEl = null;
  let hintTimer = 0;

  const measure = () => {
    half = seq.offsetWidth || track.scrollWidth * 0.5 || 0;
    autoSpeed = half > 0 ? -half / LOOP_MS : 0;
    if (reduceMotion) autoSpeed = 0;
    wrap();
  };

  const wrap = () => {
    if (half <= 0) return;
    while (position <= -half) position += half;
    while (position > 0) position -= half;
  };

  const paint = () => {
    track.style.transform = "translate3d(" + position + "px,0,0)";
  };

  const targetAuto = () => {
    if (reduceMotion) return 0;
    return hovering ? autoSpeed * HOVER_FACTOR : autoSpeed;
  };

  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    if (!lastFrame) lastFrame = now;
    let dt = now - lastFrame;
    if (dt > 32) dt = 32;
    lastFrame = now;

    if (mode === "drag") {
      lastFrame = now;
      paint();
      return;
    }

    if (mode === "throw") {
      position += velocity * dt;
      const frames = dt * 0.06;
      velocity *= Math.pow(FRICTION, frames);
      const target = targetAuto();
      if (
        Math.abs(velocity) < Math.max(THROW_MIN, Math.abs(target) * 1.15) ||
        Math.abs(velocity) < THROW_MIN
      ) {
        mode = "resume";
      }
    } else {
      const target = targetAuto();
      const t = 1 - Math.pow(1 - RESUME_LERP, dt * 0.06);
      velocity += (target - velocity) * t;
      position += velocity * dt;
      if (mode === "resume" && Math.abs(velocity - target) < 0.0005) {
        mode = "auto";
        velocity = target;
      }
    }

    wrap();
    paint();
  };

  const endDrag = (e) => {
    if (pointerId === null || e.pointerId !== pointerId) return;

    try {
      root.releasePointerCapture(pointerId);
    } catch (_) {
      /* already released */
    }

    root.classList.remove("is-dragging");
    pointerId = null;
    axis = null;

    if (!dragged) {
      mode = "resume";
      return;
    }

    suppressClick = true;
    const releaseDt = e.timeStamp - lastT;
    if (releaseDt > 0 && releaseDt < 48) {
      dragVel = (e.clientX - lastX) / releaseDt;
    }
    velocity = isFinite(dragVel) ? dragVel : 0;
    /* stale release → drop into resume instead of a fake fling */
    if (releaseDt > 80) velocity *= 0.15;
    mode = "throw";
    dragged = false;
  };

  root.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      pointerId = e.pointerId;
      axis = null;
      dragged = false;
      suppressClick = false;
      dragVel = 0;
      startX = lastX = e.clientX;
      startY = e.clientY;
      lastT = e.timeStamp;
      try {
        root.setPointerCapture(pointerId);
      } catch (_) {
        /* ignore */
      }
    },
    { passive: true }
  );

  root.addEventListener(
    "pointermove",
    (e) => {
      if (pointerId === null || e.pointerId !== pointerId) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (axis === null) {
        if (Math.abs(dx) < AXIS_PX && Math.abs(dy) < AXIS_PX) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          axis = "h";
          mode = "drag";
          root.classList.add("is-dragging");
          hideHint(true);
        } else {
          axis = "v";
          try {
            root.releasePointerCapture(pointerId);
          } catch (_) {
            /* ignore */
          }
          pointerId = null;
          return;
        }
      }

      if (axis !== "h") return;

      e.preventDefault();
      const dxFrame = e.clientX - lastX;
      const dtMove = e.timeStamp - lastT;
      position += dxFrame;
      wrap();
      paint();

      if (Math.abs(e.clientX - startX) > DRAG_PX) dragged = true;
      if (dtMove > 0) dragVel = dxFrame / dtMove;

      lastX = e.clientX;
      lastT = e.timeStamp;
    },
    { passive: false }
  );

  root.addEventListener("pointerup", endDrag);
  root.addEventListener("pointercancel", endDrag);

  root.addEventListener(
    "click",
    (e) => {
      if (!suppressClick) return;
      e.preventDefault();
      e.stopPropagation();
      suppressClick = false;
    },
    true
  );

  root.addEventListener("pointerenter", () => {
    if (mode !== "drag") hovering = true;
  });
  root.addEventListener("pointerleave", () => {
    hovering = false;
  });

  const hideHint = (persist) => {
    if (hintTimer) {
      clearTimeout(hintTimer);
      hintTimer = 0;
    }
    if (!hintEl) return;
    hintEl.classList.add("is-gone");
    if (persist) {
      try {
        sessionStorage.setItem(HINT_FLAG, "1");
      } catch (_) {
        /* private mode */
      }
    }
    const node = hintEl;
    hintEl = null;
    setTimeout(() => node.remove(), 400);
  };

  const showHint = () => {
    let seen = false;
    try {
      seen = !!sessionStorage.getItem(HINT_FLAG);
    } catch (_) {
      seen = true;
    }
    if (seen || hintEl) return;

    const host = root.closest(".marquee-shell") || root;
    hintEl = document.createElement("div");
    hintEl.className = "marquee-hint mono";
    hintEl.setAttribute("aria-hidden", "true");
    hintEl.textContent = "← drag →";
    host.appendChild(hintEl);
    requestAnimationFrame(() => {
      if (hintEl) hintEl.classList.add("is-in");
    });
    hintTimer = setTimeout(() => hideHint(true), HINT_MS);
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (let i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            showHint();
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(root);
  }

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(measure).observe(seq);
  } else {
    window.addEventListener("resize", measure, { passive: true });
  }

  measure();
  if (!reduceMotion) velocity = autoSpeed;
  paint();
  raf = requestAnimationFrame(tick);

  window.addEventListener(
    "pagehide",
    () => {
      if (raf) cancelAnimationFrame(raf);
    },
    { once: true }
  );
})();
