/**
 * Dismiss #boot-screen after assets are ready (or when #intro takes over).
 * Classic script - also callable from the module bundle via window.__dismissBootScreen.
 */
(function () {
  function dismissBootScreen(immediate) {
    var boot = document.getElementById("boot-screen");
    if (!boot || boot.dataset.dismissing === "1") return;
    boot.dataset.dismissing = "1";

    if (immediate) {
      if (boot.parentNode) boot.parentNode.removeChild(boot);
      return;
    }

    boot.classList.add("boot-done");
    var removed = false;
    var remove = function () {
      if (removed) return;
      removed = true;
      if (boot.parentNode) boot.parentNode.removeChild(boot);
    };
    boot.addEventListener("transitionend", remove, { once: true });
    setTimeout(remove, 400);
  }

  window.__dismissBootScreen = dismissBootScreen;

  /* If intro shell mounts, drop the static shield immediately (intro covers). */
  var obs;
  try {
    obs = new MutationObserver(function () {
      if (document.getElementById("intro")) {
        dismissBootScreen(true);
        if (obs) obs.disconnect();
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {
    /* ignore */
  }
})();
