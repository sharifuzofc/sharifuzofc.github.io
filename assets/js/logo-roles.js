"use strict";

/**
 * Header identity mark — rotating role line (WAAPI).
 * Pause when tab hidden or header off-screen.
 */
(function initLogoRoles() {
  const logo = document.querySelector("[data-nav-logo]");
  const ring = document.querySelector("[data-logo-ring]");
  const stage = document.querySelector("[data-logo-role-stage]");
  const playhead = document.querySelector("[data-logo-playhead]");
  const roleEl = document.querySelector("[data-logo-role]");
  const staticEl = document.querySelector("[data-logo-role-static]");
  if (!logo || !stage || !roleEl) return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileMq = matchMedia("(max-width: 767px)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Hover class for ring speed swap (animation-duration) */
  if (ring && finePointer && !reduceMotion) {
    const setFast = (on) => logo.classList.toggle("is-ring-fast", on);
    logo.addEventListener("mouseenter", () => setFast(true));
    logo.addEventListener("mouseleave", () => setFast(false));
    logo.addEventListener("focus", () => setFast(true));
    logo.addEventListener("blur", () => setFast(false));
  }

  if (reduceMotion) {
    roleEl.hidden = true;
    if (staticEl) staticEl.hidden = false;
    return;
  }

  const ROLES = [
    { id: "web", text: "</> web-app developer", kind: "type" },
    { id: "sqa", text: "sqa engineer", kind: "stamp", check: true },
    { id: "design", text: "graphics designer", kind: "gradient" },
    { id: "video", text: "video editor", kind: "scrub" },
  ];

  const ROLE_MS = 3200;
  const IDLE_MS = 350;

  let index = 0;
  let running = false;
  let tabVisible = document.visibilityState === "visible";
  let headerVisible = true;
  let timer = 0;
  let gen = 0;
  /** @type {Animation[]} */
  let activeAnims = [];

  const sleep = (ms) =>
    new Promise((resolve) => {
      clearTimeout(timer);
      timer = setTimeout(resolve, ms);
    });

  const cancelActive = () => {
    clearTimeout(timer);
    activeAnims.forEach((a) => {
      try {
        a.cancel();
      } catch (_) {
        /* noop */
      }
    });
    activeAnims = [];
  };

  const animateEl = (el, keyframes, options) => {
    const anim = el.animate(keyframes, options);
    activeAnims.push(anim);
    return anim.finished.catch(() => {});
  };

  const clearStage = () => {
    stage.replaceChildren();
    stage.className = "nav-logo-role-stage";
    stage.removeAttribute("style");
    if (playhead) {
      playhead.hidden = true;
      playhead.style.transform = "translate3d(0, -50%, 0)";
      playhead.style.opacity = "0";
    }
  };

  const canRun = () =>
    tabVisible && headerVisible && !mobileMq.matches && !reduceMotion;

  async function revealType(text, token) {
    stage.classList.add("is-type");
    const textSpan = document.createElement("span");
    textSpan.className = "nav-logo-role-text";
    const caret = document.createElement("span");
    caret.className = "nav-logo-role-caret";
    caret.setAttribute("aria-hidden", "true");
    caret.textContent = "_";
    stage.append(textSpan, caret);

    const charMs = Math.min(40, Math.floor(2000 / Math.max(text.length, 1)));
    const typed = charMs * text.length;
    for (let i = 0; i < text.length; i++) {
      if (token !== gen || !canRun()) return;
      textSpan.textContent = text.slice(0, i + 1);
      await sleep(charMs);
    }
    if (token !== gen || !canRun()) return;
    await sleep(Math.max(0, ROLE_MS - typed));
  }

  async function revealStamp(text, token) {
    stage.classList.add("is-stamp");
    const parts = text.split(/\s+/).filter(Boolean);
    const nodes = parts.map((word, i) => {
      const span = document.createElement("span");
      span.className = "nav-logo-stamp-word";
      span.textContent = i < parts.length - 1 ? `${word} ` : word;
      span.style.opacity = "0";
      span.style.clipPath = "inset(0 100% 0 0)";
      return span;
    });
    const check = document.createElement("span");
    check.className = "nav-logo-check";
    check.textContent = "✓";
    check.setAttribute("aria-hidden", "true");
    stage.append(...nodes, check);

    const stampMs = 260;
    for (let i = 0; i < nodes.length; i++) {
      if (token !== gen || !canRun()) return;
      await animateEl(
        nodes[i],
        [
          { opacity: 0, clipPath: "inset(0 100% 0 0)" },
          { opacity: 1, clipPath: "inset(0 0 0 0)" },
        ],
        { duration: stampMs, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
      );
      await sleep(50);
    }
    if (token !== gen || !canRun()) return;
    check.classList.add("is-pop");
    await animateEl(
      check,
      [
        { transform: "scale(0)", opacity: 0 },
        { transform: "scale(1.15)", opacity: 1, offset: 0.55 },
        { transform: "scale(1)", opacity: 1 },
      ],
      { duration: 120, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
    );
    const used = parts.length * (stampMs + 50) + 120;
    await sleep(Math.max(0, ROLE_MS - used));
  }

  async function revealGradient(text, token) {
    stage.classList.add("is-gradient");
    const el = document.createElement("span");
    el.className = "nav-logo-role-text nav-logo-gradient-text";
    el.textContent = text;
    el.style.opacity = "0";
    el.style.clipPath = "inset(0 100% 0 0)";
    el.style.backgroundPosition = "0% 50%";
    stage.append(el);

    await animateEl(
      el,
      [
        {
          opacity: 0,
          clipPath: "inset(0 100% 0 0)",
          backgroundPosition: "0% 50%",
        },
        {
          opacity: 1,
          clipPath: "inset(0 0 0 0)",
          backgroundPosition: "100% 50%",
        },
      ],
      { duration: 1000, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
    );
    if (token !== gen || !canRun()) return;
    await sleep(Math.max(0, ROLE_MS - 1000));
  }

  async function revealScrub(text, token) {
    stage.classList.add("is-scrub");
    const el = document.createElement("span");
    el.className = "nav-logo-role-text";
    el.textContent = text;
    el.style.clipPath = "inset(0 100% 0 0)";
    el.style.opacity = "1";
    stage.append(el);

    if (playhead) {
      playhead.hidden = false;
      playhead.style.opacity = "1";
      playhead.style.transform = "translate3d(0, -50%, 0)";
    }

    const duration = 1100;
    const textAnim = animateEl(
      el,
      [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }],
      { duration, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
    );

    let headAnim = Promise.resolve();
    if (playhead) {
      const w = Math.max(roleEl.clientWidth, el.scrollWidth, 1);
      headAnim = animateEl(
        playhead,
        [
          { transform: "translate3d(0, -50%, 0)", opacity: 1 },
          { transform: `translate3d(${w}px, -50%, 0)`, opacity: 1 },
        ],
        { duration, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
      );
    }

    await Promise.all([textAnim, headAnim]);
    if (token !== gen || !canRun()) return;
    if (playhead) {
      await animateEl(playhead, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 160,
        fill: "forwards",
      });
    }
    await sleep(Math.max(0, ROLE_MS - duration - 160));
  }

  const reveals = {
    type: revealType,
    stamp: revealStamp,
    gradient: revealGradient,
    scrub: revealScrub,
  };

  async function fadeOut(token) {
    if (!stage.childNodes.length) return;
    await animateEl(stage, [{ opacity: 1 }, { opacity: 0 }], {
      duration: IDLE_MS,
      easing: "ease",
      fill: "forwards",
    });
    if (token !== gen) return;
    clearStage();
    stage.style.opacity = "1";
  }

  async function loop() {
    if (running) return;
    running = true;
    while (canRun()) {
      const token = ++gen;
      cancelActive();
      clearStage();
      stage.style.opacity = "1";

      const role = ROLES[index % ROLES.length];
      roleEl.dataset.role = role.id;
      await reveals[role.kind](role.text, token);
      if (token !== gen || !canRun()) break;

      await fadeOut(token);
      if (token !== gen || !canRun()) break;

      index = (index + 1) % ROLES.length;
    }
    running = false;
  }

  const syncMobile = () => {
    if (mobileMq.matches) {
      gen += 1;
      cancelActive();
      clearStage();
      running = false;
      return;
    }
    if (canRun() && !running) loop();
  };

  document.addEventListener("visibilitychange", () => {
    tabVisible = document.visibilityState === "visible";
    if (!tabVisible) {
      gen += 1;
      cancelActive();
      running = false;
    } else if (canRun() && !running) {
      loop();
    }
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      ([entry]) => {
        headerVisible = entry.isIntersecting;
        if (!headerVisible) {
          gen += 1;
          cancelActive();
          running = false;
        } else if (canRun() && !running) {
          loop();
        }
      },
      { threshold: 0 }
    );
    io.observe(logo.closest("[data-nav]") || logo);
  }

  if (typeof mobileMq.addEventListener === "function") {
    mobileMq.addEventListener("change", syncMobile);
  } else {
    mobileMq.addListener(syncMobile);
  }

  const startWhenReady = () => {
    syncMobile();
    if (canRun()) loop();
  };

  /* Wait for boot intro so role cycle doesn't compete with the overlay */
  if (document.documentElement.classList.contains("intro-done")) {
    startWhenReady();
  } else {
    document.addEventListener("intro:done", startWhenReady, { once: true });
    /* Failsafe if intro module absent */
    setTimeout(() => {
      if (!document.documentElement.classList.contains("intro-done")) {
        document.documentElement.classList.add("intro-done");
        startWhenReady();
      }
    }, 4000);
  }
})();
