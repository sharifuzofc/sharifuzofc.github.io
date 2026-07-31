"use strict";

/**
 * Living SRF command-prompt mark — terminal type + design wash + hanging pendulum.
 * Looks like:  $ SRF_
 * Hangs from a hairline string; cycles coding ↔ design phases.
 */
(function initSrfMark() {
  const root = document.querySelector("[data-srf-mark]");
  if (!root) return;

  const chip = root.querySelector("[data-srf-chip]");
  const lettersEl = root.querySelector("[data-srf-letters]");
  const caretEl = root.querySelector("[data-srf-caret]");
  if (!chip || !lettersEl || !caretEl) return;

  const LETTERS = ["S", "R", "F"];
  const WORD = "SRF";
  const SCRAMBLE = "01<>/#*+x";
  const PHASE_MS = 5200;
  const REST_MS = 1600;
  const CHAR_MS = 70;
  const PENDULUM_PERIOD = 3200; /* ~3.2s swing */
  const PENDULUM_Z = 5; /* ±deg around Z (pivot above) */
  const PENDULUM_Y = 6; /* ±deg phase-lagged rotY — reads 3D */
  const IMPULSE_TAU = 2000; /* damp boost back to base over ~2s */
  const PROXIMITY = 140;
  const MAX_TILT = 16;
  const MAX_TILT_HOVER = 22;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const mobileMq = matchMedia("(max-width: 767px)");

  let tabVisible = document.visibilityState === "visible";
  let headerVisible = true;
  let hovering = false;
  let running = false;
  let gen = 0;
  let timer = 0;
  /** @type {Animation[]} */
  let activeAnims = [];
  let raf = 0;
  let t0 = performance.now();
  let lastTick = t0;
  let lastPointerX = null;

  let pendZ = 0;
  let pendY = 0;
  let swingBoost = 0; /* extra amplitude from impulses; decays to 0 */
  let tiltX = 0;
  let tiltY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;
  let clickScale = 1;

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

  const setLetters = (text) => {
    lettersEl.textContent = text;
  };

  const showCaret = (on) => {
    caretEl.hidden = !on;
  };

  const resetText = () => {
    showCaret(false);
    lettersEl.classList.remove("is-gradient", "is-scramble");
    lettersEl.style.backgroundPosition = "";
    setLetters(WORD);
  };

  const canRunPhases = () =>
    tabVisible && headerVisible && !hovering && !reduceMotion;

  const applyTransform = () => {
    const rz = pendZ;
    const ry = pendY + tiltY;
    const rx = tiltX;
    chip.style.transform =
      `rotateZ(${rz.toFixed(3)}deg) ` +
      `rotateY(${ry.toFixed(3)}deg) ` +
      `rotateX(${rx.toFixed(3)}deg) ` +
      `scale(${clickScale})`;
    const angle = 135 + ry * 3.2 - rz * 2.4;
    chip.style.setProperty("--srf-rim-angle", `${angle.toFixed(2)}deg`);
  };

  const kickSwing = (amount) => {
    swingBoost = Math.min(1.85, Math.max(0, swingBoost + amount));
  };

  const tickFloat = (now) => {
    raf = 0;
    const dt = Math.min(48, Math.max(0, now - lastTick));
    lastTick = now;

    if (reduceMotion || !tabVisible || !headerVisible) {
      pendZ = 0;
      pendY = 0;
      swingBoost = 0;
      tiltX += (0 - tiltX) * 0.2;
      tiltY += (0 - tiltY) * 0.2;
      applyTransform();
      return;
    }

    /* Exponential damp of impulse boost → base rhythm over ~2s */
    if (swingBoost > 0.001) {
      swingBoost *= Math.exp(-dt / IMPULSE_TAU);
    } else {
      swingBoost = 0;
    }

    const t = (now - t0) / PENDULUM_PERIOD;
    const amp = 1 + swingBoost;
    /* Sine pendulum around pivot above; Y lag so it reads 3D, not flat */
    pendZ = Math.sin(t * Math.PI * 2) * PENDULUM_Z * amp;
    pendY = Math.sin(t * Math.PI * 2 - 0.42) * PENDULUM_Y * amp;

    const lerp = hovering ? 0.24 : 0.14;
    tiltX += (targetTiltX - tiltX) * lerp;
    tiltY += (targetTiltY - tiltY) * lerp;

    applyTransform();
    raf = requestAnimationFrame(tickFloat);
  };

  const startFloat = () => {
    if (raf || reduceMotion) return;
    t0 = performance.now();
    lastTick = t0;
    raf = requestAnimationFrame(tickFloat);
  };

  const stopFloat = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    pendZ = 0;
    pendY = 0;
    swingBoost = 0;
    tiltX = 0;
    tiltY = 0;
    targetTiltX = 0;
    targetTiltY = 0;
    clickScale = 1;
    lastPointerX = null;
    applyTransform();
  };

  /** Phase A — coding: terminal backspace + retype with blinking caret */
  const phaseCode = async (token) => {
    const start = performance.now();
    showCaret(true);
    lettersEl.classList.remove("is-gradient");
    let buf = WORD;

    for (let i = LETTERS.length - 1; i >= 0; i--) {
      if (token !== gen || !canRunPhases()) return;
      buf = buf.slice(0, i);
      setLetters(buf || "\u00a0");
      await sleep(CHAR_MS);
    }

    /* Brief scramble burst (coding noise) */
    lettersEl.classList.add("is-scramble");
    for (let n = 0; n < 5; n++) {
      if (token !== gen || !canRunPhases()) return;
      let noise = "";
      for (let k = 0; k < 3; k++) {
        noise += SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0];
      }
      setLetters(noise);
      await sleep(45);
    }
    lettersEl.classList.remove("is-scramble");

    buf = "";
    for (let i = 0; i < LETTERS.length; i++) {
      if (token !== gen || !canRunPhases()) return;
      buf += LETTERS[i];
      setLetters(buf);
      await sleep(CHAR_MS + 10);
    }

    showCaret(false);
    setLetters(WORD);
    const remain = Math.max(0, PHASE_MS - (performance.now() - start));
    if (token === gen && canRunPhases()) await sleep(remain);
  };

  /** Phase B — graphics/design: gradient wash + letter 3D flip */
  const phaseDesign = async (token) => {
    if (token !== gen || !canRunPhases()) return;
    showCaret(false);
    lettersEl.classList.add("is-gradient");

    await Promise.all([
      animateEl(
        lettersEl,
        [
          { backgroundPosition: "100% 50%", transform: "rotateX(0deg)" },
          { backgroundPosition: "0% 50%", transform: "rotateX(0deg)" },
        ],
        {
          duration: 1100,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        }
      ),
      animateEl(
        chip,
        [
          {
            filter: "brightness(1)",
            offset: 0,
          },
          {
            filter: "brightness(1.15)",
            offset: 0.45,
          },
          {
            filter: "brightness(1)",
            offset: 1,
          },
        ],
        { duration: 1100, easing: "ease-in-out" }
      ),
    ]);

    if (token !== gen) return;

    /* Flip each letter in 3D sequence */
    const chars = WORD.split("");
    setLetters("");
    lettersEl.replaceChildren();
    const spans = chars.map((ch, i) => {
      const s = document.createElement("span");
      s.className = "srf-mark__ch";
      s.textContent = ch;
      s.style.setProperty("--i", String(i));
      lettersEl.appendChild(s);
      return s;
    });
    lettersEl.classList.add("is-gradient");

    await Promise.all(
      spans.map((s, i) =>
        animateEl(
          s,
          [
            { transform: "rotateY(-85deg) translateZ(-8px)", opacity: 0.35 },
            { transform: "rotateY(0deg) translateZ(0)", opacity: 1 },
          ],
          {
            duration: 420,
            delay: i * 90,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards",
          }
        )
      )
    );

    if (token !== gen) return;
    lettersEl.classList.remove("is-gradient");
    lettersEl.replaceChildren();
    setLetters(WORD);
    lettersEl.style.backgroundPosition = "";

    const remain = Math.max(0, PHASE_MS - 2000);
    if (token === gen && canRunPhases()) await sleep(remain);
  };

  const loop = async () => {
    if (running) return;
    running = true;
    const token = ++gen;

    while (token === gen) {
      if (!canRunPhases()) {
        resetText();
        await sleep(220);
        continue;
      }

      await phaseCode(token);
      if (token !== gen) break;
      if (canRunPhases()) await sleep(REST_MS);

      if (token !== gen) break;
      if (!canRunPhases()) continue;

      await phaseDesign(token);
      if (token !== gen) break;
      if (canRunPhases()) await sleep(REST_MS);
    }

    running = false;
  };

  const syncLifecycle = () => {
    const active = tabVisible && headerVisible && !reduceMotion;
    if (active) {
      startFloat();
      if (!running) loop();
    } else {
      cancelActive();
      gen += 1;
      running = false;
      resetText();
      if (!tabVisible || !headerVisible) stopFloat();
      else startFloat();
    }
  };

  if (finePointer && !reduceMotion && !mobileMq.matches) {
    window.addEventListener(
      "pointermove",
      (e) => {
        if (!tabVisible || !headerVisible) return;
        const rect = chip.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);

        /* Drag-past impulse — velocity kick when the cursor swipes near the mark */
        if (lastPointerX != null && dist < PROXIMITY * 1.35) {
          const vx = e.clientX - lastPointerX;
          if (Math.abs(vx) > 3) {
            kickSwing(Math.min(0.55, Math.abs(vx) * 0.012));
          }
        }
        lastPointerX = e.clientX;

        if (dist > PROXIMITY && !hovering) {
          targetTiltX = 0;
          targetTiltY = 0;
          return;
        }

        const max = hovering ? MAX_TILT_HOVER : MAX_TILT;
        const strength = hovering ? 1 : Math.max(0, 1 - dist / PROXIMITY);
        targetTiltY = (dx / PROXIMITY) * max * strength;
        targetTiltX = (-dy / PROXIMITY) * max * strength;
      },
      { passive: true }
    );

    root.addEventListener("mouseenter", () => {
      hovering = true;
      root.classList.add("is-hover");
      kickSwing(0.45);
      cancelActive();
      gen += 1;
      running = false;
      resetText();
      showCaret(true);
    });

    root.addEventListener("mouseleave", () => {
      hovering = false;
      root.classList.remove("is-hover");
      showCaret(false);
      targetTiltX = 0;
      targetTiltY = 0;
      if (canRunPhases() && !running) loop();
    });
  }

  root.addEventListener("pointerdown", () => {
    if (reduceMotion) return;
    clickScale = 0.94;
    kickSwing(0.7);
    applyTransform();
  });
  const releaseClick = () => {
    if (reduceMotion) return;
    clickScale = 1;
    applyTransform();
  };
  root.addEventListener("pointerup", releaseClick);
  root.addEventListener("pointercancel", releaseClick);

  document.addEventListener("visibilitychange", () => {
    tabVisible = document.visibilityState === "visible";
    syncLifecycle();
  });

  const header = root.closest(".nav") || root;
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      ([entry]) => {
        headerVisible = entry.isIntersecting && entry.intersectionRatio > 0;
        syncLifecycle();
      },
      { threshold: 0.01 }
    );
    io.observe(header);
  }

  mobileMq.addEventListener("change", () => {
    if (mobileMq.matches) {
      targetTiltX = 0;
      targetTiltY = 0;
    }
  });

  if (reduceMotion) {
    resetText();
    chip.style.transform = "none";
    return;
  }

  applyTransform();
  syncLifecycle();
})();
