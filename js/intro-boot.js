/**
 * Pre-paint intro gate + failsafe unlock.
 * Classic script in /public (CSP-safe, no inline).
 *
 * Leaves #boot-screen (dark + closed slits) as first paint.
 * Module IntroSequence mounts #intro and crossfades the boot shield away.
 */
/* Synchronous in <head> - gates CSS entrance hides; no-JS never gets this class */
(function markJsReady() {
  document.documentElement.classList.add("js-ready");
})();

(function introFailsafe() {
  var FAILSAFE_MS = 10000;
  window.__introFailsafe = setTimeout(function () {
    var root = document.documentElement;
    var intro = document.getElementById("intro");
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    root.classList.add("intro-done", "entrance-done");
    root.classList.remove("awaiting-intro", "entrance-pending");
    try {
      document.body.style.overflow = "";
      root.style.overflow = "";
    } catch (e) {
      /* ignore */
    }
    try {
      sessionStorage.setItem("introSeen", "1");
      sessionStorage.setItem("introPlayed", "true");
    } catch (e) {
      /* ignore */
    }
    try {
      if (typeof window.__dismissBootScreen === "function") {
        window.__dismissBootScreen(true);
      } else {
        var boot = document.getElementById("boot-screen");
        if (boot && boot.parentNode) boot.parentNode.removeChild(boot);
      }
    } catch (e) {
      /* ignore */
    }
  }, FAILSAFE_MS);
})();

(function introGate() {
  try {
    if (
      sessionStorage.getItem("introSeen") ||
      sessionStorage.getItem("introPlayed")
    ) {
      document.documentElement.classList.add(
        "intro-skip",
        "intro-done",
        "entrance-done"
      );
      return;
    }
  } catch (e) {
    document.documentElement.classList.add(
      "intro-skip",
      "intro-done",
      "entrance-done"
    );
    return;
  }

  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add(
        "intro-skip",
        "intro-done",
        "entrance-done"
      );
      return;
    }
  } catch (e) {
    /* ignore */
  }

  /* Arm home entrance poses before modules paint - no flash of final layout.
     .js-ready gates CSS hidden states so no-JS users never see a blank page. */
  document.documentElement.classList.add(
    "js-ready",
    "awaiting-intro",
    "entrance-pending"
  );
})();
