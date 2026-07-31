"use strict";

/**
 * Boot intro v4 — 2.0s hard target, buttery continuous pour.
 * Lifecycle:
 *   - Insert #intro only when sessionStorage introSeen is unset
 *   - Solid #070b14, never backdrop-filter
 *   - 12 stream lines @ 90ms (no group pauses) → type final @ 35ms/char → hold 250ms → exit
 *   - Progress: single rAF scaleX tween 0→100%, ends with last typed char
 *   - Exit: panel .98/200ms + wipe-up 450ms; hero letters lead by 100ms
 *   - Failsafe force-remove at 3500ms
 */
(function initBootIntro() {
  const FLAG = "introSeen";
  const FAILSAFE_MS = 3500;
  const MAX_LINES = 9;
  const LINE_MS = 90;
  const ENTER_MS = 200;
  const CHAR_MS = 35;
  const HOLD_MS = 250;
  const SCROLL_MS = 220;
  const PANEL_EXIT_MS = 200;
  const WIPE_MS = 450;
  const HERO_LEAD_MS = 100;
  const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
  const EASE_WIPE = "cubic-bezier(0.65, 0, 0.35, 1)";
  const FINAL_TEXT = "launching portfolio";
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
  const panel = intro.querySelector(".boot-intro__panel");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";

  /* 12 stream lines — no group pauses. Final type line is separate. */
  const LINES = [
    { kind: "prompt", color: "cyan", text: "$ init sharifuz.dev --mode=production", check: false },
    { kind: "log", color: "cyan", label: "▸ web", text: "import { React, REST, Tailwind } … ok", check: false },
    { kind: "log", color: "cyan", label: "▸ web", text: "building responsive layouts … 90+ Lighthouse", check: true },
    { kind: "log", color: "cyan", label: "▸ web", text: "auth flows + API integration … deployed", check: true },
    { kind: "log", color: "green", label: "▸ sqa", text: "selenium.start() · cypress run · postman sync", check: false },
    { kind: "log", color: "green", label: "▸ sqa", text: "412 test cases executed … 98% pass", check: true },
    { kind: "log", color: "green", label: "▸ sqa", text: "0 P1 escapes in production", check: true },
    { kind: "log", color: "violet", label: "▸ design", text: "photoshop + illustrator + figma … loaded", check: false },
    { kind: "log", color: "violet", label: "▸ design", text: "brand kits · thumbnails · UI graphics", check: true },
    { kind: "log", color: "orange", label: "▸ video", text: "premiere render --preset=retention-cut", check: false },
    { kind: "log", color: "orange", label: "▸ video", text: "hooks in 3s · captions styled · 4K", check: true },
    { kind: "log", color: "cyan", label: "▸ boot", text: "assets hashed · routes warm · fonts ready", check: true },
    { kind: "type", color: "cyan", text: FINAL_TEXT, check: false },
  ];

  const STREAM = LINES.filter((l) => l.kind !== "type");
  const PROGRESS_MS = STREAM.length * LINE_MS + FINAL_TEXT.length * CHAR_MS;

  let completed = false;
  let failsafeTimer = 0;
  let termOffsetY = 0;
  let progressCurrent = 0;
  let progressRaf = 0;
  let scrollRaf = 0;
  let enterRaf = 0;
  const pendingEnter = [];

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const setBarVisual = (n) => {
    const pct = Math.max(0, Math.min(100, n));
    if (bar) bar.style.transform = `scaleX(${pct / 100})`;
    if (pctEl) {
      /* Sub-integer until the end — no visible integer stepping */
      pctEl.textContent = pct >= 99.95 ? "100%" : `${pct.toFixed(1)}%`;
    }
  };

  /** One continuous 0→100% rAF tween, duration = stream + type */
  const startProgressTween = (duration) => {
    const from = 0;
    const target = 100;
    const start = performance.now();
    cancelAnimationFrame(progressRaf);
    progressCurrent = 0;
    setBarVisual(0);

    return new Promise((resolve) => {
      const tick = (now) => {
        if (completed) {
          resolve();
          return;
        }
        const t = Math.min(1, (now - start) / duration);
        /* ease-out cubic — continuous, never stepped */
        const eased = 1 - Math.pow(1 - t, 3);
        progressCurrent = from + (target - from) * eased;
        setBarVisual(progressCurrent);
        if (t < 1) {
          progressRaf = requestAnimationFrame(tick);
        } else {
          progressCurrent = 100;
          setBarVisual(100);
          resolve();
        }
      };
      progressRaf = requestAnimationFrame(tick);
    });
  };

  const stampOk = (el) => {
    if (!el) return;
    el.animate(
      [
        { transform: "scale(1)", opacity: 0 },
        { transform: "scale(1.1)", opacity: 1, offset: 0.55 },
        { transform: "scale(1)", opacity: 1 },
      ],
      { duration: 160, easing: EASE_OUT, fill: "forwards" }
    ).finished.catch(() => {});
  };

  const applyTermOffset = (y, animate) => {
    if (!term) return;
    if (!animate || reduceMotion) {
      term.style.transition = "none";
      term.style.transform = `translate3d(0, ${y}px, 0)`;
      return;
    }
    term.style.transition = `transform ${SCROLL_MS}ms ${EASE_OUT}`;
    term.style.transform = `translate3d(0, ${y}px, 0)`;
  };

  /** Batch scroll + trim + aged classes into one rAF (no layout thrash mid-frame) */
  const scheduleScrollSync = () => {
    if (!term || !scrollEl) return;
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      if (completed || !term) return;

      while (term.children.length > MAX_LINES) {
        const first = term.firstElementChild;
        if (!first) break;
        const h = first.offsetHeight || 0;
        first.remove();
        if (h > 0) {
          termOffsetY += h;
          term.style.transition = "none";
          term.style.transform = `translate3d(0, ${termOffsetY}px, 0)`;
        }
      }

      const kids = term.children;
      for (let i = 0; i < kids.length; i++) {
        const age = kids.length - 1 - i;
        kids[i].classList.toggle("is-aged", age >= 5);
      }

      const overflow = term.scrollHeight - scrollEl.clientHeight;
      const target = overflow > 0 ? -overflow : 0;
      if (Math.abs(target - termOffsetY) >= 0.5) {
        /* Re-enable transition after any trim compensate */
        if (term.style.transition === "none") {
          void term.offsetHeight;
        }
        termOffsetY = target;
        applyTermOffset(termOffsetY, true);
      }
    });
  };

  /** Queue is-in on next frame so CSS transition always fires; overlaps freely */
  const queueEnter = (row) => {
    pendingEnter.push(row);
    if (enterRaf) return;
    enterRaf = requestAnimationFrame(() => {
      enterRaf = 0;
      const batch = pendingEnter.splice(0, pendingEnter.length);
      for (let i = 0; i < batch.length; i++) {
        batch[i].classList.add("is-in");
      }
    });
  };

  const buildRow = (line, opts = {}) => {
    const row = document.createElement("div");
    row.className = "boot-intro__line";
    row.style.willChange = "opacity, transform";

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

  /** Exit: panel .98/200ms, overlay wipe 450ms; hero leads by 100ms */
  const destroyOverlay = () => {
    if (completed) return;
    completed = true;
    clearTimeout(failsafeTimer);
    cancelAnimationFrame(progressRaf);
    cancelAnimationFrame(scrollRaf);
    cancelAnimationFrame(enterRaf);
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

    if (panel) {
      panel.style.transition = `transform ${PANEL_EXIT_MS}ms ${EASE_WIPE}, opacity ${PANEL_EXIT_MS}ms ${EASE_WIPE}`;
      panel.style.transform = "scale(0.98)";
      panel.style.opacity = "0";
    }

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
        text.textContent = FINAL_TEXT;
        const caret = document.createElement("span");
        caret.className = "boot-intro__caret";
        caret.textContent = "_";
        row.append(prompt, text, caret);
      }
      term.appendChild(row);
    });
    scheduleScrollSync();
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

    /* Continuous bar — finishes exactly when typing completes (~2.0s from first line) */
    const progressDone = startProgressTween(PROGRESS_MS);

    for (let i = 0; i < STREAM.length; i++) {
      if (completed) return;
      const line = STREAM[i];
      const { row, ok } = buildRow(line);
      term.appendChild(row);
      queueEnter(row);
      scheduleScrollSync();
      if (ok) stampOk(ok);
      await sleep(LINE_MS);
    }

    if (completed) return;

    const typeLine = LINES[LINES.length - 1];
    const { row, typeEl } = buildRow(typeLine, { typeTarget: true });
    const caret = document.createElement("span");
    caret.className = "boot-intro__caret";
    caret.textContent = "_";
    row.appendChild(caret);
    term.appendChild(row);
    queueEnter(row);
    scheduleScrollSync();
    await typeText(typeEl, typeLine.text, CHAR_MS);
    if (completed) return;

    await progressDone;
    await sleep(HOLD_MS);
    if (!completed) destroyOverlay();
  };

  failsafeTimer = setTimeout(() => {
    if (!completed) destroyOverlay();
  }, FAILSAFE_MS);

  runSequence().catch(() => destroyOverlay());
})();
