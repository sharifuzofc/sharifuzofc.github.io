/**
 * Pre-paint intro shell + failsafe unlock.
 * Classic script in /public so it ships to dist unchanged (CSP-safe, no inline).
 * Static markup only — no untrusted data.
 */
(function introFailsafe() {
  var FAILSAFE_MS = 3500;
  window.__introFailsafe = setTimeout(function () {
    var root = document.documentElement;
    var intro = document.getElementById("intro");
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    root.classList.add("intro-done");
    root.classList.remove("awaiting-intro");
    try {
      document.body.style.overflow = "";
      root.style.overflow = "";
    } catch (e) {
      /* ignore */
    }
    try {
      sessionStorage.setItem("introSeen", "1");
    } catch (e) {
      /* ignore */
    }
  }, FAILSAFE_MS);
})();

(function introShell() {
  try {
    if (sessionStorage.getItem("introSeen")) {
      document.documentElement.classList.add("intro-skip", "intro-done");
      return;
    }
  } catch (e) {
    document.documentElement.classList.add("intro-skip", "intro-done");
    return;
  }

  document.documentElement.classList.add("awaiting-intro");
  var intro = document.createElement("div");
  intro.id = "intro";
  intro.className = "boot-intro-shell";
  intro.setAttribute("role", "status");
  intro.setAttribute("aria-live", "polite");
  intro.setAttribute("aria-label", "Loading portfolio");

  var panel = document.createElement("div");
  panel.className = "boot-intro__panel";

  var win = document.createElement("div");
  win.className = "boot-intro__window";

  var chrome = document.createElement("div");
  chrome.className = "boot-intro__chrome";
  chrome.setAttribute("aria-hidden", "true");

  var traffic = document.createElement("span");
  traffic.className = "boot-intro__traffic";
  ["red", "yellow", "green"].forEach(function (c) {
    var i = document.createElement("i");
    i.className = "boot-intro__dot boot-intro__dot--" + c;
    traffic.appendChild(i);
  });

  var chromeTitle = document.createElement("span");
  chromeTitle.className = "boot-intro__chrome-title";
  chromeTitle.textContent = "sharifuz.dev — compile";

  chrome.appendChild(traffic);
  chrome.appendChild(chromeTitle);

  var scroll = document.createElement("div");
  scroll.className = "boot-intro__scroll";
  var term = document.createElement("div");
  term.className = "boot-intro__term";
  term.setAttribute("data-boot-term", "");
  scroll.appendChild(term);

  win.appendChild(chrome);
  win.appendChild(scroll);

  var barWrap = document.createElement("div");
  barWrap.className = "boot-intro__bar-wrap";
  var bar = document.createElement("div");
  bar.className = "boot-intro__bar";
  bar.setAttribute("data-boot-bar", "");
  barWrap.appendChild(bar);

  var pct = document.createElement("div");
  pct.className = "boot-intro__pct";
  pct.setAttribute("data-boot-pct", "");
  pct.textContent = "0%";

  panel.appendChild(win);
  panel.appendChild(barWrap);
  panel.appendChild(pct);
  intro.appendChild(panel);

  if (document.body) {
    document.body.appendChild(intro);
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      document.body.appendChild(intro);
    });
  }
})();
