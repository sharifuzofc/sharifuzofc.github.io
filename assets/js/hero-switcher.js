"use strict";

/**
 * Hero discipline switcher — sliding pill tracks the active segment.
 *
 * Positioning is screen-space only:
 *   origin = pill.getBoundingClientRect() - current translate(x,y)
 *   target = seg.getBoundingClientRect()
 *   apply translate(target - origin) + width/height
 * Never uses offsetLeft / hardcoded slots / cached geometry.
 */
(function () {
  const root = document.querySelector("[data-hero-switcher]");
  if (!root) return;

  const track = root.querySelector(".hero-switcher-track");
  const pill = root.querySelector("[data-switcher-pill]");
  const segs = [...root.querySelectorAll(".hero-switcher-seg")];
  const lines = [...root.querySelectorAll(".hero-tagline-line")];
  const heroEl = document.getElementById("home") || root.closest(".hero");
  if (!track || !pill || !segs.length) return;

  const ORDER = ["web", "sqa", "design", "video"];
  const AUTO_MS = 4000;
  const CLICK_PAUSE_MS = 8000;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let active = reduceMotion ? "sqa" : "web";
  let autoTimer = 0;
  let resumeTimer = 0;
  let resizeTimer = 0;
  let pausedUntil = 0;
  let inView = true;
  let tabActive = !document.hidden;
  let ready = false;

  function announce(id) {
    try {
      window.dispatchEvent(
        new CustomEvent("hero:discipline", { detail: { id } })
      );
    } catch (_) {
      /* ignore */
    }
    if (typeof window.__hero3dSetDiscipline === "function") {
      window.__hero3dSetDiscipline(id);
    }
  }

  function activeSeg() {
    return segs.find((s) => s.dataset.discipline === active) || segs[0];
  }

  /** Read the pill's current translate from computed transform matrix. */
  function readTranslate() {
    const t = getComputedStyle(pill).transform;
    if (!t || t === "none") return { x: 0, y: 0 };
    try {
      const m = new DOMMatrixReadOnly(t);
      return { x: m.m41, y: m.m42 };
    } catch (_) {
      const match = t.match(/matrix\(([^)]+)\)/);
      if (!match) return { x: 0, y: 0 };
      const p = match[1].split(",").map((n) => parseFloat(n.trim()));
      return { x: p[4] || 0, y: p[5] || 0 };
    }
  }

  /**
   * Bulletproof place: derive origin from the pill's own painted box minus
   * its current translate. That cancels track border/padding, ancestor
   * `translate` on .hero-content, and liquid-glass quirks — no guessing.
   */
  function placePill(btn, animate) {
    if (!btn || !ready) return;

    const segRect = btn.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();
    const { x: tx, y: ty } = readTranslate();

    /* Screen position of translate(0,0) top-left */
    const originLeft = pillRect.left - tx;
    const originTop = pillRect.top - ty;

    /* Re-read segment in the same turn (layout may have settled) */
    const seg = btn.getBoundingClientRect();
    const x = seg.left - originLeft;
    const y = seg.top - originTop;
    const w = seg.width;
    const h = seg.height;

    if (!Number.isFinite(x) || !Number.isFinite(y) || w < 1 || h < 1) return;

    if (!animate || reduceMotion) {
      const prev = pill.style.transition;
      pill.style.transition = "none";
      pill.style.transform = `translate(${x}px, ${y}px)`;
      pill.style.width = `${w}px`;
      pill.style.height = `${h}px`;
      void pill.offsetWidth;
      pill.style.transition = prev;
      return;
    }

    pill.style.transform = `translate(${x}px, ${y}px)`;
    pill.style.width = `${w}px`;
    pill.style.height = `${h}px`;
  }

  function setActive(id, { fromClick = false, animate = true } = {}) {
    if (!ORDER.includes(id)) return;
    active = id;
    track.dataset.active = id;
    pill.dataset.discipline = id;

    segs.forEach((btn) => {
      const on = btn.dataset.discipline === id;
      btn.setAttribute("aria-selected", on ? "true" : "false");
      btn.tabIndex = on ? 0 : -1;
    });

    lines.forEach((line) => {
      const on = line.dataset.tagline === id;
      line.classList.toggle("is-active", on);
      line.setAttribute("aria-hidden", on ? "false" : "true");
      if (on) line.removeAttribute("hidden");
      else line.setAttribute("hidden", "");
    });

    /* Fresh measure every activation — never reuse cached slots */
    placePill(activeSeg(), animate);
    announce(id);

    if (fromClick) {
      pausedUntil = Date.now() + CLICK_PAUSE_MS;
      clearTimeout(resumeTimer);
      stopAuto();
      resumeTimer = window.setTimeout(() => {
        pausedUntil = 0;
        startAuto();
      }, CLICK_PAUSE_MS);
    }
  }

  function nextId() {
    const i = ORDER.indexOf(active);
    return ORDER[(i + 1) % ORDER.length];
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = 0;
    }
  }

  function startAuto() {
    stopAuto();
    if (reduceMotion) return;
    if (!inView || !tabActive || !ready) return;
    if (Date.now() < pausedUntil) return;
    autoTimer = window.setInterval(() => {
      if (!inView || !tabActive || Date.now() < pausedUntil) return;
      setActive(nextId(), { animate: true });
    }, AUTO_MS);
  }

  function remeasureSnap() {
    placePill(activeSeg(), false);
  }

  segs.forEach((btn) => {
    btn.addEventListener("click", () => {
      setActive(btn.dataset.discipline, { fromClick: true, animate: true });
      btn.focus({ preventScroll: true });
    });

    btn.addEventListener("keydown", (e) => {
      const i = ORDER.indexOf(btn.dataset.discipline);
      if (i < 0) return;
      let next = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        next = (i + 1) % ORDER.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        next = (i - 1 + ORDER.length) % ORDER.length;
      } else if (e.key === "Home") {
        next = 0;
      } else if (e.key === "End") {
        next = ORDER.length - 1;
      } else {
        return;
      }
      e.preventDefault();
      const target = segs.find((s) => s.dataset.discipline === ORDER[next]);
      if (!target) return;
      setActive(ORDER[next], { fromClick: true, animate: true });
      target.focus({ preventScroll: true });
    });
  });

  addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(remeasureSnap, 80);
    },
    { passive: true }
  );

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => {
      remeasureSnap();
    });
    ro.observe(track);
    segs.forEach((s) => ro.observe(s));
  }

  /* Hero identity fadeUp ends — transform clears; re-snap */
  root.addEventListener("animationend", (e) => {
    if (e.target === root || e.target === track) remeasureSnap();
  });

  document.addEventListener("visibilitychange", () => {
    tabActive = !document.hidden;
    if (tabActive) {
      remeasureSnap();
      startAuto();
    } else {
      stopAuto();
    }
  });

  if (heroEl && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) {
          remeasureSnap();
          startAuto();
        } else {
          stopAuto();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(heroEl);
  }

  function boot() {
    ready = true;
    setActive(active, { animate: false });
    requestAnimationFrame(() => {
      remeasureSnap();
      requestAnimationFrame(() => {
        remeasureSnap();
        startAuto();
      });
    });
  }

  /* Fonts can change mono metrics after first paint — always re-snap */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      boot();
      /* Late webfont swap */
      if (document.fonts.addEventListener) {
        document.fonts.addEventListener("loadingdone", () => remeasureSnap());
      }
    }).catch(boot);
  } else {
    boot();
  }
})();
