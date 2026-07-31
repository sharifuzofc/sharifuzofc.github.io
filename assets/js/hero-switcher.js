"use strict";

/**
 * Hero discipline switcher — all 4 roles visible; one active pill cycles.
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
  let pausedUntil = 0;
  let inView = true;
  let tabActive = !document.hidden;

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

  function placePill(btn, animate) {
    if (!btn) return;
    const tr = track.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const x = br.left - tr.left - 4;
    const y = br.top - tr.top - 4;
    if (!animate) {
      const prev = pill.style.transition;
      pill.style.transition = "none";
      track.style.setProperty("--pill-x", `${x}px`);
      track.style.setProperty("--pill-y", `${y}px`);
      track.style.setProperty("--pill-w", `${br.width}px`);
      track.style.setProperty("--pill-h", `${br.height}px`);
      // force reflow so transitionless snap sticks
      void pill.offsetWidth;
      pill.style.transition = prev;
      return;
    }
    track.style.setProperty("--pill-x", `${x}px`);
    track.style.setProperty("--pill-y", `${y}px`);
    track.style.setProperty("--pill-w", `${br.width}px`);
    track.style.setProperty("--pill-h", `${br.height}px`);
  }

  function setActive(id, { fromClick = false, animate = true } = {}) {
    if (!ORDER.includes(id)) return;
    active = id;
    track.dataset.active = id;

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

    const btn = segs.find((s) => s.dataset.discipline === id);
    placePill(btn, animate);
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
    if (!inView || !tabActive) return;
    if (Date.now() < pausedUntil) return;
    autoTimer = window.setInterval(() => {
      if (!inView || !tabActive || Date.now() < pausedUntil) return;
      setActive(nextId(), { animate: true });
    }, AUTO_MS);
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

  const onResize = () => placePill(
    segs.find((s) => s.dataset.discipline === active),
    false
  );
  addEventListener("resize", onResize, { passive: true });

  document.addEventListener("visibilitychange", () => {
    tabActive = !document.hidden;
    if (tabActive) startAuto();
    else stopAuto();
  });

  if (heroEl && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) startAuto();
        else stopAuto();
      },
      { threshold: 0.2 }
    );
    io.observe(heroEl);
  }

  // Initial state
  setActive(active, { animate: false });
  requestAnimationFrame(() => {
    placePill(
      segs.find((s) => s.dataset.discipline === active),
      false
    );
    startAuto();
  });
})();
