"use strict";

/**
 * Boot intro v2 — cinematic terminal.
 * Lifecycle (exact):
 *   - Insert #intro only when sessionStorage introSeen is unset
 *   - Solid #070b14, never backdrop-filter
 *   - Exit: .intro-done → opacity 0 (400ms) → remove() on transitionend + 600ms fallback
 *   - Failsafe force-remove at 3500ms
 */
(function initBootIntro() {
  const FLAG = "introSeen";
  const FAILSAFE_MS = 3500;
  const MAX_LINES = 9;
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

  /* Guard: if never inserted (seen / skip), just unlock page */
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

  /* Belt-and-suspenders: if flag flipped after insert, remove immediately */
  if (seen) {
    forceRemoveIntro(intro);
    finishPage();
    return;
  }

  const term = intro.querySelector("[data-boot-term]");
  const bar = intro.querySelector("[data-boot-bar]");
  const pctEl = intro.querySelector("[data-boot-pct]");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";

  const LINES = [
    { kind: "prompt", color: "cyan", text: "$ init sharifuz.dev --mode=production", check: false, progress: 6 },
    { kind: "log", color: "cyan", label: "▸ web", text: "import { React, REST, Tailwind } … ok", check: false, progress: 14 },
    { kind: "log", color: "cyan", label: "▸ web", text: "building responsive layouts … 90+ Lighthouse", check: true, progress: 22 },
    { kind: "log", color: "cyan", label: "▸ web", text: "auth flows + API integration … deployed", check: true, progress: 30 },
    { kind: "log", color: "green", label: "▸ sqa", text: "selenium.start() · cypress run · postman sync", check: false, progress: 40 },
    { kind: "log", color: "green", label: "▸ sqa", text: "412 test cases executed … 98% pass", check: true, progress: 50 },
    { kind: "log", color: "green", label: "▸ sqa", text: "0 P1 escapes in production", check: true, progress: 58 },
    { kind: "log", color: "violet", label: "▸ design", text: "photoshop + illustrator + figma … loaded", check: false, progress: 68 },
    { kind: "log", color: "violet", label: "▸ design", text: "brand kits · thumbnails · UI graphics", check: true, progress: 76 },
    { kind: "log", color: "orange", label: "▸ video", text: "premiere render --preset=retention-cut", check: false, progress: 86 },
    { kind: "log", color: "orange", label: "▸ video", text: "hooks in 3s · captions styled · 4K", check: true, progress: 94 },
    { kind: "type", color: "cyan", text: "$ launching portfolio", check: false, progress: 100 },
  ];

  let completed = false;
  let failsafeTimer = 0;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const setProgress = (n) => {
    if (bar) bar.style.width = `${n}%`;
    if (pctEl) pctEl.textContent = `${Math.round(n)}%`;
  };

  const stampOk = (el) => {
    if (!el) return Promise.resolve();
    return el
      .animate(
        [
          { transform: "scale(0)", opacity: 0 },
          { transform: "scale(1.15)", opacity: 1, offset: 0.55 },
          { transform: "scale(1)", opacity: 1 },
        ],
        { duration: 120, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
      )
      .finished.catch(() => {});
  };

  const trimLog = () => {
    if (!term) return;
    while (term.children.length > MAX_LINES) {
      term.firstElementChild.remove();
    }
    const kids = [...term.children];
    kids.forEach((row, i) => {
      const age = kids.length - 1 - i;
      row.classList.toggle("is-aged", age >= 5);
    });
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

  /** Exact exit: .intro-done → opacity 0 → remove() */
  const destroyOverlay = () => {
    if (completed) return;
    completed = true;
    clearTimeout(failsafeTimer);

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
      finishPage();
    };

    const onEnd = (e) => {
      if (e.target !== intro) return;
      if (e.propertyName && e.propertyName !== "opacity") return;
      intro.removeEventListener("transitionend", onEnd);
      removeNow();
    };

    intro.addEventListener("transitionend", onEnd);
    /* Force style before class so transition always fires */
    intro.style.transition = "opacity 400ms ease";
    intro.classList.add("intro-done");
    intro.style.opacity = "0";
    intro.style.pointerEvents = "none";

    setTimeout(removeNow, 600);
  };

  const renderStaticComplete = () => {
    if (!term) return;
    term.replaceChildren();
    LINES.forEach((line) => {
      const { row, ok } = buildRow(line);
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
    setProgress(100);
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
    setProgress(0);

    const LINE_MS = 52;
    const CHAR_MS = 28;

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
        trimLog();
        setProgress(96);
        await typeText(typeEl, "launching portfolio", CHAR_MS);
        if (completed) return;
        setProgress(100);
        await sleep(180);
        break;
      }

      const { row, ok } = buildRow(line);
      term.appendChild(row);
      trimLog();

      if (ok) {
        const pop = stampOk(ok);
        setProgress(line.progress);
        await Promise.race([pop, sleep(LINE_MS)]);
        await sleep(Math.max(0, LINE_MS - 40));
      } else {
        setProgress(line.progress);
        await sleep(LINE_MS);
      }
    }

    if (!completed) destroyOverlay();
  };

  failsafeTimer = setTimeout(() => {
    if (!completed) destroyOverlay();
  }, FAILSAFE_MS);

  const start = () => {
    runSequence().catch(() => destroyOverlay());
  };

  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, sleep(350)]).then(start);
  } else {
    start();
  }
})();
