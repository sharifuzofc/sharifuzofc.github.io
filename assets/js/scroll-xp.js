"use strict";

/**
 * Scroll XP Game — session journey with completion celebration + exit.
 * XP: monotonic max depth, rAF-throttled, paused when tab hidden.
 */
(function initScrollXp() {
  const DONE_KEY = "scrollGameDone";
  const STORAGE_KEY = "scrollXp.v1";
  const COLORS = ["#22d3ee", "#34d399", "#a78bfa", "#fb923c"];

  const root = document.querySelector("[data-scroll-xp]");
  if (!root) return;

  /* Session already finished — never mount (no flash; node stays hidden then gone) */
  try {
    if (sessionStorage.getItem(DONE_KEY)) {
      root.remove();
      return;
    }
  } catch {
    /* private mode — continue without persistence */
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const LEVELS = [
    { lv: 1, name: "Visitor", min: 0, nextAt: 25 },
    { lv: 2, name: "Explorer", min: 25, nextAt: 55 },
    { lv: 3, name: "Insider", min: 55, nextAt: 85 },
    { lv: 4, name: "Pro", min: 85, nextAt: 100 },
  ];

  const BONUSES = [
    { id: "work", sel: "#work", xp: 5, msg: "+5 XP — found the work" },
    { id: "contact", sel: "#contact", xp: 5, msg: "+5 XP — reached contact" },
  ];

  const els = {
    panel: root.querySelector("[data-scroll-xp-panel]"),
    lv: root.querySelector("[data-scroll-xp-lv]"),
    name: root.querySelector("[data-scroll-xp-name]"),
    count: root.querySelector("[data-scroll-xp-count]"),
    fill: root.querySelector("[data-scroll-xp-fill]"),
    bar: root.querySelector(".scroll-xp-bar"),
    meta: root.querySelector("[data-scroll-xp-meta]"),
    chip: root.querySelector("[data-scroll-xp-chip]"),
    chipLv: root.querySelector("[data-scroll-xp-chip-lv]"),
    chipPct: root.querySelector("[data-scroll-xp-chip-pct]"),
    toast: root.querySelector("[data-scroll-xp-toast]"),
  };

  let maxDepth = 0;
  let bonusXp = 0;
  let claimed = Object.create(null);
  let completed = false; /* celebration sequence started / finished */
  let celebrating = false;
  let lastLevel = 1;
  let rafId = 0;
  let toastTimer = 0;
  let expandTimer = 0;
  let ready = false;
  let pendingCelebration = false;
  let focusBeforeCard = null;
  let cardEl = null;
  let confettiHost = null;
  let autoCloseTimer = 0;
  let listenersTeardown = [];

  function load() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.maxDepth === "number") maxDepth = Math.min(1, Math.max(0, data.maxDepth));
      if (typeof data.bonusXp === "number") bonusXp = Math.min(10, Math.max(0, data.bonusXp));
      if (data.claimed && typeof data.claimed === "object") claimed = data.claimed;
      /* Old sessions that already hit 100 without the new exit — mark done, no remount flash */
      if (data.completed) {
        try {
          sessionStorage.setItem(DONE_KEY, "1");
        } catch {
          /* ignore */
        }
        root.remove();
        completed = true;
      }
    } catch {
      /* ignore */
    }
  }

  function save() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ maxDepth, bonusXp, claimed, completed })
      );
    } catch {
      /* ignore */
    }
  }

  function markGameDone() {
    try {
      sessionStorage.setItem(DONE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function levelFor(xp) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].min) return LEVELS[i];
    }
    return LEVELS[0];
  }

  function totalXp() {
    return Math.min(100, Math.round(maxDepth * 100) + bonusXp);
  }

  function levelProgress(xp, level) {
    if (level.lv >= 4) {
      return Math.min(1, (xp - level.min) / (100 - level.min || 1));
    }
    const span = level.nextAt - level.min;
    return Math.min(1, Math.max(0, (xp - level.min) / span));
  }

  function metaLine(xp, level) {
    const medals = level.lv;
    if (xp >= 100) return `Journey complete · ${medals} 🏅`;
    if (level.lv >= 4) {
      return `${Math.max(0, 100 - xp)} XP to max · ${medals} 🏅`;
    }
    const nextLevel = LEVELS[level.lv] || LEVELS[LEVELS.length - 1];
    return `${Math.max(0, level.nextAt - xp)} XP to ${nextLevel.name} · ${medals} 🏅`;
  }

  function showToast(msg) {
    if (!els.toast || !msg) return;
    els.toast.hidden = false;
    els.toast.textContent = msg;
    els.toast.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("is-on");
      window.setTimeout(() => {
        els.toast.hidden = true;
      }, 260);
    }, 2200);
  }

  function playLevelUp() {
    if (reduceMotion) return;
    els.lv?.classList.remove("is-pop");
    els.name?.classList.remove("is-swap");
    els.bar?.classList.remove("is-flash");
    void els.lv?.offsetWidth;
    els.lv?.classList.add("is-pop");
    els.name?.classList.add("is-swap");
    els.bar?.classList.add("is-flash");
    window.setTimeout(() => {
      els.lv?.classList.remove("is-pop");
      els.name?.classList.remove("is-swap");
      els.bar?.classList.remove("is-flash");
    }, 420);
  }

  function playBarShine() {
    if (!els.bar || reduceMotion) return;
    els.bar.classList.remove("is-shine");
    void els.bar.offsetWidth;
    els.bar.classList.add("is-shine");
  }

  function render(opts = {}) {
    if (completed && !celebrating) return;
    const xp = totalXp();
    const level = levelFor(xp);
    const pct = Math.round(xp);
    const fill = xp >= 100 ? 100 : levelProgress(xp, level) * 100;

    if (els.lv) els.lv.textContent = `LV${level.lv}`;
    if (els.name) els.name.textContent = level.name;
    if (els.count) els.count.textContent = `${xp} XP`;
    if (els.fill) els.fill.style.width = `${fill}%`;
    if (els.meta) els.meta.textContent = metaLine(xp, level);
    if (els.chipLv) els.chipLv.textContent = `LV${level.lv}`;
    if (els.chipPct) els.chipPct.textContent = `${pct}%`;
    if (els.chip) {
      els.chip.setAttribute(
        "aria-label",
        `Scroll journey LV${level.lv} ${level.name}, ${pct} percent`
      );
    }

    root.classList.toggle("is-complete", xp >= 100);

    if (opts.levelUp && level.lv > lastLevel) playLevelUp();
    lastLevel = level.lv;

    if (xp >= 100 && !completed) {
      beginCompletion();
    }
  }

  function measureDepth() {
    if (document.hidden) return false;
    const doc = document.documentElement;
    const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
    const depth = Math.min(1, Math.max(0, window.scrollY / scrollable));
    if (depth > maxDepth) {
      maxDepth = depth;
      save();
      return true;
    }
    return false;
  }

  function checkBonuses() {
    if (document.hidden) return false;
    let gained = false;
    for (const b of BONUSES) {
      if (claimed[b.id]) continue;
      const el = document.querySelector(b.sel);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.55 && rect.bottom > 80) {
        claimed[b.id] = true;
        bonusXp = Math.min(10, bonusXp + b.xp);
        gained = true;
        showToast(b.msg);
      }
    }
    if (gained) save();
    return gained;
  }

  function tick() {
    rafId = 0;
    if (!ready || completed) return;
    if (document.hidden) return;
    const depthChanged = measureDepth();
    const bonusChanged = checkBonuses();
    if (depthChanged || bonusChanged) {
      render({ levelUp: true });
    } else {
      render();
    }
  }

  function onScroll() {
    if (rafId || completed || document.hidden) return;
    rafId = requestAnimationFrame(tick);
  }

  function expandMobile() {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    if (completed) return;
    root.classList.add("is-expanded");
    window.clearTimeout(expandTimer);
    expandTimer = window.setTimeout(() => {
      root.classList.remove("is-expanded");
    }, 3000);
  }

  /* ---------- Completion sequence ---------- */

  function beginCompletion() {
    if (completed) return;
    completed = true;
    celebrating = true;
    save();

    /* Force LV4 / 100% paint + shine */
    if (els.lv) els.lv.textContent = "LV4";
    if (els.name) els.name.textContent = "Pro";
    if (els.count) els.count.textContent = "100 XP";
    if (els.fill) els.fill.style.width = "100%";
    if (els.meta) els.meta.textContent = "Journey complete · 4 🏅";
    if (els.chipLv) els.chipLv.textContent = "LV4";
    if (els.chipPct) els.chipPct.textContent = "100%";
    root.classList.add("is-complete");
    playBarShine();
    playLevelUp();

    const launch = () => {
      window.setTimeout(() => showCelebration(), 400);
    };

    if (document.hidden) {
      pendingCelebration = true;
      return;
    }
    launch();
  }

  function spawnConfetti() {
    if (reduceMotion) return;
    const host = document.createElement("div");
    host.className = "scroll-xp-confetti";
    host.setAttribute("aria-hidden", "true");
    document.body.appendChild(host);
    confettiHost = host;

    const n = 30 + Math.floor(Math.random() * 11);
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "scroll-xp-confetti-piece";
      const color = COLORS[i % COLORS.length];
      const x = 10 + Math.random() * 80;
      const delay = Math.random() * 0.35;
      const dur = 1.1 + Math.random() * 0.5;
      const rot = (Math.random() * 720 - 360).toFixed(0);
      const drift = (Math.random() * 80 - 40).toFixed(0);
      p.style.setProperty("--c", color);
      p.style.setProperty("--x", `${x}vw`);
      p.style.setProperty("--delay", `${delay}s`);
      p.style.setProperty("--dur", `${dur}s`);
      p.style.setProperty("--rot", `${rot}deg`);
      p.style.setProperty("--drift", `${drift}px`);
      host.appendChild(p);
    }

    window.setTimeout(() => {
      host.remove();
      if (confettiHost === host) confettiHost = null;
    }, 1600);
  }

  function showCelebration() {
    if (cardEl) return;
    pendingCelebration = false;
    focusBeforeCard = document.activeElement;

    const wrap = document.createElement("div");
    wrap.className = "scroll-xp-win" + (reduceMotion ? " is-reduced" : "");
    wrap.innerHTML = `
      <div class="scroll-xp-win-backdrop" data-scroll-xp-win-dismiss></div>
      <div
        class="scroll-xp-win-card liquid-glass liquid-glass--card"
        role="status"
        aria-live="polite"
        aria-labelledby="scroll-xp-win-title"
        tabindex="-1"
        data-scroll-xp-win-card
      >
        <span class="lg-shine"></span>
        <button type="button" class="scroll-xp-win-close" data-scroll-xp-win-dismiss aria-label="Close celebration">✕</button>
        <div class="scroll-xp-win-trophy" aria-hidden="true">🏆</div>
        <h2 class="scroll-xp-win-title" id="scroll-xp-win-title">Journey complete!</h2>
        <p class="scroll-xp-win-copy">You explored 100% — that's the whole story.</p>
        <p class="scroll-xp-win-level mono">Level: Pro · 4 🏅</p>
        <a class="scroll-xp-win-cta liquid-glass liquid-glass--cyan" href="#contact" data-scroll-xp-win-cta>
          <span class="lg-shine"></span>
          Start a project <span aria-hidden="true">→</span>
        </a>
      </div>
    `;
    document.body.appendChild(wrap);
    cardEl = wrap;

    spawnConfetti();

    const card = wrap.querySelector("[data-scroll-xp-win-card]");
    requestAnimationFrame(() => {
      wrap.classList.add("is-in");
      card?.focus({ preventScroll: true });
    });

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismissCelebration();
      }
    };
    document.addEventListener("keydown", onKey);
    listenersTeardown.push(() => document.removeEventListener("keydown", onKey));

    wrap.querySelectorAll("[data-scroll-xp-win-dismiss]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        dismissCelebration();
      });
    });

    wrap.querySelector("[data-scroll-xp-win-cta]")?.addEventListener("click", () => {
      /* Let hash navigation run, then tear down */
      dismissCelebration();
    });

    window.clearTimeout(autoCloseTimer);
    autoCloseTimer = window.setTimeout(() => dismissCelebration(), 6000);
  }

  function dismissCelebration() {
    if (!cardEl) {
      exitWidget();
      return;
    }
    window.clearTimeout(autoCloseTimer);
    const wrap = cardEl;
    cardEl = null;

    listenersTeardown.forEach((fn) => fn());
    listenersTeardown = [];

    const restoreFocus = () => {
      if (focusBeforeCard && typeof focusBeforeCard.focus === "function") {
        try {
          focusBeforeCard.focus({ preventScroll: true });
        } catch {
          /* ignore */
        }
      }
      focusBeforeCard = null;
    };

    if (reduceMotion) {
      wrap.remove();
      restoreFocus();
      exitWidget();
      return;
    }

    wrap.classList.remove("is-in");
    wrap.classList.add("is-out");
    window.setTimeout(() => {
      wrap.remove();
      restoreFocus();
      exitWidget();
    }, 400);
  }

  function exitWidget() {
    celebrating = false;
    markGameDone();
    save();

    window.removeEventListener("scroll", onScroll);
    /* resize / visibility cleaned below via flags */

    if (!root.isConnected) return;

    if (reduceMotion) {
      root.remove();
      return;
    }

    root.classList.remove("is-ready");
    root.classList.add("is-exiting");
    root.style.pointerEvents = "none";
    window.setTimeout(() => {
      root.remove();
    }, 600);
  }

  function onVisibility() {
    if (document.hidden) return;
    if (pendingCelebration) {
      pendingCelebration = false;
      window.setTimeout(() => showCelebration(), 400);
      return;
    }
    if (!completed && ready) onScroll();
  }

  function reveal() {
    if (completed && !celebrating) return; /* removed during load() */
    if (!root.isConnected) return;
    root.hidden = false;
    requestAnimationFrame(() => {
      root.classList.add("is-ready");
      ready = true;
      measureDepth();
      checkBonuses();
      render();
    });
  }

  load();
  /* Inline boot or prior completion may have removed the node */
  if (!document.contains(root)) return;

  lastLevel = levelFor(totalXp()).lv;

  /* Fast scrollers: still play full sequence once — no special skip */
  const delay = maxDepth > 0.02 || bonusXp > 0 || reduceMotion ? 0 : 2000;
  window.setTimeout(reveal, delay);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener(
    "resize",
    () => {
      if (rafId || completed || document.hidden) return;
      rafId = requestAnimationFrame(tick);
    },
    { passive: true }
  );
  document.addEventListener("visibilitychange", onVisibility);

  els.chip?.addEventListener("click", expandMobile);
  root.addEventListener("click", (e) => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    if (e.target.closest("[data-scroll-xp-chip]")) return;
    if (root.classList.contains("is-expanded")) expandMobile();
  });
})();
