"use strict";

/**
 * Boot intro v3 — paced terminal (~3.0–3.2s), smooth line flow.
 * Lifecycle:
 *   - Insert #intro only when sessionStorage introSeen is unset
 *   - Solid #070b14, never backdrop-filter
 *   - Exit: wipe-up 500ms; hero letters start 100ms before wipe clears
 *   - Failsafe force-remove at 4500ms
 */
(function initBootIntro() {
  const FLAG = "introSeen";
  const FAILSAFE_MS = 4500;
  const MAX_LINES = 9;
  const LINE_MS = 110;
  const GROUP_PAUSE_MS = 180;
  const ENTER_MS = 220;
  const CHAR_MS = 55;
  const HOLD_MS = 350;
  const SCROLL_MS = 240;
  const WIPE_MS = 500;
  const HERO_LEAD_MS = 100; /* hero letters begin this many ms before wipe ends */
  const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
  const EASE_WIPE = "cubic-bezier(0.65, 0, 0.35, 1)";
  const root = document.documentElement;

  const finishPage = () => {
    root.classList.add("intro-done");
    root.classList.remove("awaiting-intro");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    document.dispatchEvent(new CustomEvent("intro:done"));
  };

  const forceRemoveIntro = (node) => {
    if (!node) return;
    if (node.parentNode) node.remove();
  };

  let intro = document.getElementById("intro");
  if (!intro || root.classList.contains("intro-skip")) {
    if (intro) forceRemoveIntro(intro);
    finishPage();
    return;
  }

  let seen = false;
  try {
    seen = !!sessionStorage.getItem(FLAG);
  } catch (_) {
    seen = true;
  }

  if (seen) {
    forceRemoveIntro(intro);
    finishPage();
    return;
  }

  const term = intro.querySelector("[data-boot-term]");
  const bar = intro.querySelector("[data-boot-bar]");
  const pctEl = intro.querySelector("[data-boot-pct]");
  const scrollEl = intro.querySelector(".boot-intro__scroll");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";

  /*
   * groupEnd: last ✓ of a discipline — 180ms beat before the next group.
   * progress: checkpoint the bar tweens toward (100 only after final type).
   */
  const LINES = [
    { kind: "prompt", color: "cyan", text: "$ init sharifuz.dev --mode=production", check: false, progress: 6 },
    { kind: "log", color: "cyan", label: "▸ web", text: "import { React, REST, Tailwind } … ok", check: false, progress: 14 },
    { kind: "log", color: "cyan", label: "▸ web", text: "building responsive layouts … 90+ Lighthouse", check: true, progress: 22 },
    { kind: "log", color: "cyan", label: "▸ web", text: "auth flows + API integration … deployed", check: true, progress: 30, groupEnd: true },
    { kind: "log", color: "green", label: "▸ sqa", text: "selenium.start() · cypress run · postman sync", check: false, progress: 40 },
    { kind: "log", color: "green", label: "▸ sqa", text: "412 test cases executed … 98% pass", check: true, progress: 50 },
    { kind: "log", color: "green", label: "▸ sqa", text: "0 P1 escapes in production", check: true, progress: 58, groupEnd: true },
    { kind: "log", color: "violet", label: "▸ design", text: "photoshop + illustrator + figma … loaded", check: false, progress: 68 },
    { kind: "log", color: "violet", label: "▸ design", text: "brand kits · thumbnails · UI graphics", check: true, progress: 76, groupEnd: true },
    { kind: "log", color: "orange", label: "▸ video", text: "premiere render --preset=retention-cut", check: false, progress: 86 },
    { kind: "log", color: "orange", label: "▸ video", text: "hooks in 3s · captions styled · 4K", check: true, progress: 94, groupEnd: true },
    { kind: "type", color: "cyan", text: "launching portfolio", check: false, progress: 100 },
  ];

  let completed = false;
  let failsafeTimer = 0;
  let termOffsetY = 0;
  let progressCurrent = 0;
  let progressRaf = 0;
  let progressResolve = null;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const setBarVisual = (n) => {
    const pct = Math.max(0, Math.min(100, n));
    if (bar) bar.style.transform = `scaleX(${pct / 100})`;
    if (pctEl) pctEl.textContent = `${Math.round(pct)}%`;
  };

  /** Smooth tween between checkpoints — reaches exact target when done */
  const tweenProgress = (to, duration = 380) => {
    const target = Math.max(0, Math.min(100, to));
    const from = progressCurrent;
    if (Math.abs(target - from) < 0.05) {
      progressCurrent = target;
      setBarVisual(target);
      return Promise.resolve();
    }
    if (progressResolve) progressResolve();
    const start = performance.now();
    return new Promise((resolve) => {
      progressResolve = resolve;
      cancelAnimationFrame(progressRaf);
      const tick = (now) => {
        if (completed && target < 100) {
          resolve();
          return;
        }
        const t = Math.min(1, (now - start) / duration);
        /* smoothstep-ish ease out */
        const eased = 1 - Math.pow(1 - t, 3);
        progressCurrent = from + (target - from) * eased;
        setBarVisual(progressCurrent);
        if (t < 1) {
          progressRaf = requestAnimationFrame(tick);
        } else {
          progressCurrent = target;
          setBarVisual(target);
          progressResolve = null;
          resolve();
        }
      };
      progressRaf = requestAnimationFrame(tick);
    });
  };

  const stampOk = (el) => {
    if (!el) return Promise.resolve();
    return el
      .animate(
        [
          { transform: "scale(1)", opacity: 0 },
          { transform: "scale(1.12)", opacity: 1, offset: 0.55 },
          { transform: "scale(1)", opacity: 1 },
        ],
        { duration: 180, easing: EASE_OUT, fill: "forwards" }
      )
      .finished.catch(() => {});
  };

  const applyTermOffset = (y, animate) => {
    if (!term) return Promise.resolve();
    if (!animate || reduceMotion) {
      term.style.transition = "none";
      term.style.transform = `translate3d(0, ${y}px, 0)`;
      void term.offsetWidth;
      term.style.transition = "";
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const onEnd = (e) => {
        if (e.propertyName !== "transform") return;
        term.removeEventListener("transitionend", onEnd);
        resolve();
      };
      term.addEventListener("transitionend", onEnd);
      term.style.transition = `transform ${SCROLL_MS}ms ${EASE_OUT}`;
      term.style.transform = `translate3d(0, ${y}px, 0)`;
      setTimeout(resolve, SCROLL_MS + 40);
    });
  };

  const syncScroll = async () => {
    if (!term || !scrollEl) return;
    const overflow = term.scrollHeight - scrollEl.clientHeight;
    const target = overflow > 0 ? -overflow : 0;
    if (Math.abs(target - termOffsetY) < 0.5) return;
    termOffsetY = target;
    await applyTermOffset(termOffsetY, true);
  };

  const trimLog = async () => {
    if (!term) return;
    while (term.children.length > MAX_LINES) {
      const first = term.firstElementChild;
      if (!first) break;
      const h = first.getBoundingClientRect().height || 0;
      first.remove();
      /* Removing from top: compensate translate so the view doesn't jump */
      if (h > 0) {
        termOffsetY += h;
        term.style.transition = "none";
        term.style.transform = `translate3d(0, ${termOffsetY}px, 0)`;
        void term.offsetWidth;
        term.style.transition = "";
      }
    }
    const kids = [...term.children];
    kids.forEach((row, i) => {
      const age = kids.length - 1 - i;
      row.classList.toggle("is-aged", age >= 5);
    });
    await syncScroll();
  };

  const buildRow = (line, opts = {}) => {
    const row = document.createElement("div");
    row.className = "boot-intro__line";

    if (line.kind === "prompt" || line.kind === "type") {
      const prompt = document.createElement("span");
      prompt.className = `boot-intro__tag boot-intro__tag--${line.color}`;
      const rest = document.createElement("span");
      rest.className = "boot-intro__text";
      if (opts.typeTarget) {
        prompt.textContent = "$ ";
        row.append(prompt, rest);
        return { row, typeEl: rest };
      }
      prompt.textContent = line.text;
      row.append(prompt);
      return { row, typeEl: null };
    }

    const tag = document.createElement("span");
    tag.className = `boot-intro__tag boot-intro__tag--${line.color}`;
    tag.textContent = line.label;

    const text = document.createElement("span");
    text.className = "boot-intro__text";
    text.textContent = ` ${line.text}`;

    row.append(tag, text);

    if (line.check) {
      const ok = document.createElement("span");
      ok.className = `boot-intro__ok boot-intro__ok--${line.color}`;
      ok.textContent = "✓";
      row.appendChild(ok);
      return { row, typeEl: null, ok };
    }
    return { row, typeEl: null };
  };

  const enterLine = (row) =>
    new Promise((resolve) => {
      requestAnimationFrame(() => {
        row.classList.add("is-in");
        setTimeout(resolve, ENTER_MS);
      });
    });

  /** Exit: terminal scales+fades, overlay wipes up; hero leads by 100ms */
  const destroyOverlay = () => {
    if (completed) return;
    completed = true;
    clearTimeout(failsafeTimer);
    cancelAnimationFrame(progressRaf);
    try {
      clearTimeout(window.__introFailsafe);
    } catch (_) {
      /* inline failsafe may be absent */
    }

    try {
      sessionStorage.setItem(FLAG, "1");
    } catch (_) {
      /* private mode */
    }

    intro = document.getElementById("intro");
    if (!intro) {
      finishPage();
      return;
    }

    let removed = false;
    const removeNow = () => {
      if (removed) return;
      removed = true;
      const node = document.getElementById("intro");
      if (node) node.remove();
      /* ensure page unlocked even if hero already started */
      root.classList.remove("awaiting-intro");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (!root.classList.contains("intro-done")) finishPage();
    };

    const onEnd = (e) => {
      if (e.target !== intro) return;
      intro.removeEventListener("transitionend", onEnd);
      removeNow();
    };

    intro.addEventListener("transitionend", onEnd);
    intro.style.transition = `opacity ${WIPE_MS}ms ${EASE_WIPE}, transform ${WIPE_MS}ms ${EASE_WIPE}`;
    intro.classList.add("intro-done", "intro-wipe");
    intro.style.pointerEvents = "none";

    /* Hero letter-rise starts 100ms before wipe fully clears */
    setTimeout(() => {
      if (!root.classList.contains("intro-done")) {
        root.classList.add("intro-done");
        root.classList.remove("awaiting-intro");
        document.dispatchEvent(new CustomEvent("intro:done"));
      }
    }, Math.max(0, WIPE_MS - HERO_LEAD_MS));

    setTimeout(removeNow, WIPE_MS + 80);
  };

  const renderStaticComplete = () => {
    if (!term) return;
    term.replaceChildren();
    termOffsetY = 0;
    term.style.transform = "none";
    LINES.forEach((line) => {
      const { row, ok } = buildRow(line);
      row.classList.add("is-in");
      if (ok) ok.style.transform = "scale(1)";
      if (line.kind === "type") {
        row.replaceChildren();
        const prompt = document.createElement("span");
        prompt.className = "boot-intro__tag boot-intro__tag--cyan";
        prompt.textContent = "$ ";
        const text = document.createElement("span");
        text.className = "boot-intro__text";
        text.textContent = "launching portfolio";
        const caret = document.createElement("span");
        caret.className = "boot-intro__caret";
        caret.textContent = "_";
        row.append(prompt, text, caret);
      }
      term.appendChild(row);
    });
    trimLog();
    progressCurrent = 100;
    setBarVisual(100);
  };

  const typeText = async (el, text, ms) => {
    for (let i = 0; i < text.length; i++) {
      if (completed) return;
      el.textContent += text[i];
      await sleep(ms);
    }
  };

  const runSequence = async () => {
    if (!term) {
      destroyOverlay();
      return;
    }

    if (reduceMotion) {
      renderStaticComplete();
      await sleep(250);
      destroyOverlay();
      return;
    }

    term.replaceChildren();
    termOffsetY = 0;
    term.style.transform = "translate3d(0,0,0)";
    progressCurrent = 0;
    setBarVisual(0);

    for (let i = 0; i < LINES.length; i++) {
      if (completed) return;
      const line = LINES[i];

      if (line.kind === "type") {
        const { row, typeEl } = buildRow(line, { typeTarget: true });
        const caret = document.createElement("span");
        caret.className = "boot-intro__caret";
        caret.textContent = "_";
        row.appendChild(caret);
        term.appendChild(row);
        await trimLog();
        await enterLine(row);
        /* Hold just under 100 until typing finishes */
        tweenProgress(96, 280);
        await typeText(typeEl, line.text, CHAR_MS);
        if (completed) return;
        await tweenProgress(100, 220);
        await sleep(HOLD_MS);
        break;
      }

      const { row, ok } = buildRow(line);
      term.appendChild(row);
      /* Scroll + entrance run in parallel with cadence — fluid pour */
      void trimLog();
      void enterLine(row);
      tweenProgress(line.progress, 360);
      if (ok) stampOk(ok);
      await sleep(LINE_MS);
      if (line.groupEnd) await sleep(GROUP_PAUSE_MS);
    }

    if (!completed) destroyOverlay();
  };

  failsafeTimer = setTimeout(() => {
    if (!completed) destroyOverlay();
  }, FAILSAFE_MS);

  runSequence().catch(() => destroyOverlay());
})();
