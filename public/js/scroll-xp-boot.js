/**
 * Strip scroll-XP widget before module boot when already completed.
 * Externalized for CSP (no inline scripts).
 */
(function () {
  try {
    if (sessionStorage.getItem("scrollGameDone")) {
      var el = document.querySelector("[data-scroll-xp]");
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
  } catch (_) {
    /* ignore */
  }
})();
