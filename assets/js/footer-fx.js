"use strict";

/** Footer interactions: copy-email chip + smooth back-to-top */
(function initFooter() {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    const value = btn.getAttribute("data-copy");
    const label = btn.querySelector("[data-copy-label]");
    const live = btn.querySelector("[data-copy-live]");
    if (!value || !label) return;

    const idleText = label.textContent;
    let timer = 0;

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }

      btn.classList.add("is-copied");
      label.textContent = "Copied ✓";
      if (live) live.textContent = "Copied to clipboard";
      btn.setAttribute("aria-label", "Email copied to clipboard");

      clearTimeout(timer);
      timer = window.setTimeout(() => {
        btn.classList.remove("is-copied");
        label.textContent = idleText;
        if (live) live.textContent = "";
        btn.setAttribute("aria-label", `Copy email address ${value}`);
      }, 1500);
    });
  });

  document.querySelectorAll("[data-footer-top]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
  });
})();
