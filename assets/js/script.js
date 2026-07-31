"use strict";

/* ============ NAV (3D CSS-dot menu + Liquid Glass scroll + macOS pill) ============ */
(function initNav() {
  const nav = document.querySelector("[data-nav]");
  const burger = document.querySelector("[data-burger]");
  const drawer = document.querySelector("[data-nav-drawer]");
  const desktop = document.querySelector("[data-nav-desktop]");
  const pill = document.querySelector("[data-nav-pill]");
  const links = desktop
    ? [...desktop.querySelectorAll("[data-nav-link]")]
    : [];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PILL_BASE = 100;
  let menuOpen = false;
  let openTimer = 0;

  const closeBtn = drawer?.querySelector("[data-menu-close]");

  const focusables = () => {
    if (!drawer) return [];
    return [
      ...drawer.querySelectorAll(
        'a[href], button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
      ),
    ].filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
  };

  const setOpen = (open) => {
    if (!burger || !drawer) return;
    if (open === menuOpen) return;
    menuOpen = open;

    clearTimeout(openTimer);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", "Menu");
    document.documentElement.classList.toggle("menu-open", open);

    if (open) {
      drawer.hidden = false;
      // force reflow so open transition plays
      void drawer.offsetWidth;
      drawer.classList.add("is-open");
      if (!reduceMotion) {
        burger.classList.add("is-opening");
        openTimer = window.setTimeout(() => burger.classList.remove("is-opening"), 380);
      }
      window.setTimeout(() => {
        const target = closeBtn || focusables()[0];
        target?.focus({ preventScroll: true, focusVisible: false });
      }, reduceMotion ? 0 : 80);
    } else {
      drawer.classList.remove("is-open");
      burger.classList.remove("is-opening");
      const hide = () => {
        if (!menuOpen) drawer.hidden = true;
      };
      if (reduceMotion) hide();
      else openTimer = window.setTimeout(hide, 380);
      burger.focus({ preventScroll: true });
    }
  };

  if (burger && drawer) {
    let pressTimer = 0;
    burger.addEventListener("click", () => {
      const willOpen = !menuOpen;
      if (reduceMotion) {
        setOpen(willOpen);
        return;
      }
      clearTimeout(pressTimer);
      burger.classList.add("is-pressing");
      if (willOpen) burger.classList.add("is-rim-flash");
      pressTimer = window.setTimeout(() => {
        burger.classList.remove("is-pressing");
        setOpen(willOpen);
        if (willOpen) {
          window.setTimeout(() => burger.classList.remove("is-rim-flash"), 400);
        }
      }, 90);
    });
    drawer.querySelectorAll("[data-drawer-close]").forEach((el) => {
      el.addEventListener("click", () => setOpen(false));
    });
    drawer.querySelectorAll("[data-drawer-link]").forEach((a) => {
      a.addEventListener("click", () => setOpen(false));
    });
    addEventListener("keydown", (e) => {
      if (!menuOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    // Close if resized up to desktop
    const mq = matchMedia("(min-width: 900px)");
    const onBp = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener?.("change", onBp);
  }

  if (!nav) return;

  let activeLink = links[0] || null;
  let hovering = false;

  const movePillTo = (link, instant) => {
    if (!pill || !desktop || !link) return;
    const navRect = desktop.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const x = linkRect.left - navRect.left;
    const scaleX = Math.max(linkRect.width, 1) / PILL_BASE;
    if (instant || reduceMotion) {
      pill.style.transition = "none";
    }
    pill.style.transform = `translate3d(${x}px, -50%, 0) scaleX(${scaleX})`;
    pill.classList.add("is-ready");
    if (instant || reduceMotion) {
      void pill.offsetWidth;
      pill.style.transition = "";
    }
  };

  const setActiveLink = (link, instant) => {
    if (!link) return;
    activeLink = link;
    links.forEach((a) => a.classList.toggle("is-active", a === link));
    if (!hovering) movePillTo(link, instant);
  };

  if (pill && links.length) {
    links.forEach((link) => {
      link.addEventListener("mouseenter", () => {
        hovering = true;
        movePillTo(link, false);
      });
      link.addEventListener("focus", () => {
        hovering = true;
        movePillTo(link, false);
      });
    });
    desktop.addEventListener("mouseleave", () => {
      hovering = false;
      movePillTo(activeLink, false);
    });
    desktop.addEventListener("focusout", (e) => {
      if (!desktop.contains(e.relatedTarget)) {
        hovering = false;
        movePillTo(activeLink, false);
      }
    });
    addEventListener("resize", () => movePillTo(activeLink, true));
  }

  // Scroll-spy: sync active section + pill
  const sections = links
    .map((a) => {
      const id = (a.getAttribute("href") || "").slice(1);
      const el = id ? document.getElementById(id) : null;
      return el ? { link: a, el } : null;
    })
    .filter(Boolean);

  const navOffset = () => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--nav-h");
    const h = parseFloat(raw);
    return (Number.isFinite(h) ? h : 104) + 16;
  };

  const syncSpy = () => {
    if (!sections.length) return;
    const marker = window.scrollY + navOffset();
    let current = sections[0];
    for (const item of sections) {
      if (item.el.offsetTop <= marker) current = item;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
      current = sections[sections.length - 1];
    }
    setActiveLink(current.link, false);
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrolled = window.scrollY > 24;
      nav.classList.toggle("scrolled", scrolled);
      nav.classList.toggle("is-scrolled", scrolled);
      syncSpy();
      ticking = false;
    });
  };
  onScroll();
  movePillTo(activeLink, true);
  addEventListener("scroll", onScroll, { passive: true });
})();

/* ============ HERO LETTER SPLIT (per-word nowrap — never mid-word wrap) ============ */
const heroName = document.querySelector("[data-hero-name]");
if (heroName) {
  const text = heroName.textContent.trim().replace(/\u00a0/g, " ");
  heroName.setAttribute("aria-label", text);
  heroName.textContent = "";
  let i = 0;
  text.split(/(\s+)/).forEach((token) => {
    if (!token) return;
    if (/^\s+$/.test(token)) return; /* gap handled by flex gap between .word */
    const word = document.createElement("span");
    word.className = "word";
    [...token].forEach((ch) => {
      const span = document.createElement("span");
      span.className = "char";
      span.style.setProperty("--i", String(i++));
      span.textContent = ch;
      word.appendChild(span);
    });
    heroName.appendChild(word);
  });
}

/* ============ SCROLL ANIMATIONS ============ */
(function initScrollAnimations() {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Section headings: fade up + slight scale
  document
    .querySelectorAll(".big-title, .contact-left > h2, .footer-title")
    .forEach((el) => el.classList.add("reveal-title"));

  // Cards / list items: stagger within each group
  const staggerGroups = [
    { sel: ".stat", step: 100 },
    { sel: ".contact-card", step: 0 },
  ];
  staggerGroups.forEach(({ sel, step }) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add("reveal-card");
      el.style.setProperty("--stagger", `${i * step}ms`);
    });
  });

  // Service cards: 80ms stagger reveal + viewport-gated poster .live
  (function initSvcReveal() {
    const cards = [...document.querySelectorAll(".svc-card")];
    if (!cards.length) return;
    if (reduceMotion) {
      cards.forEach((c) => c.classList.add("is-in"));
      return;
    }
    const grid = document.querySelector("[data-svc-grid]");
    const revealIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          cards.forEach((c, i) => {
            window.setTimeout(() => c.classList.add("is-in"), i * 80);
          });
          revealIo.disconnect();
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealIo.observe(grid || cards[0]);

    const liveIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("live", entry.isIntersecting);
        });
      },
      { threshold: 0.28, rootMargin: "0px 0px -4% 0px" }
    );
    cards.forEach((c) => liveIo.observe(c));
  })();

  // SQA gauge: rAF count-up synced to CSS ring timeline (paused off-screen)
  (function initSqaGaugeCount() {
    const card = document.querySelector(".svc-sqa");
    const gauge = card?.querySelector(".svc-anim-gauge");
    const label = card?.querySelector("[data-gauge-pct]");
    if (!card || !gauge || !label) return;

    const TARGET = 98;
    // Fractions of the 7.7s poster loop (must match svc-gauge-fill keyframes)
    const T_FILL_START = 0.23377;
    const T_FILL_END = 0.44156;
    const T_HOLD_END = 0.96104;

    let raf = 0;
    let lastShown = -1;

    const setPct = (n) => {
      const pct = Math.min(TARGET, Math.max(0, n | 0));
      if (pct === lastShown) return;
      lastShown = pct;
      label.textContent = pct + "%";
    };

    if (reduceMotion) {
      setPct(TARGET);
      return;
    }

    setPct(0);

    const readProgress = () => {
      const anims = gauge.getAnimations();
      for (let i = 0; i < anims.length; i++) {
        const a = anims[i];
        if (a.playState === "idle") continue;
        const timing = a.effect?.getComputedTiming?.();
        const dur = timing?.duration;
        if (!dur || dur === Infinity) continue;
        const t = a.currentTime;
        if (t == null) continue;
        return ((t % dur) + dur) % dur / dur;
      }
      return null;
    };

    const tick = () => {
      raf = 0;
      if (!card.classList.contains("live")) {
        return;
      }

      const p = readProgress();
      if (p == null) {
        setPct(0);
      } else if (p < T_FILL_START) {
        setPct(0);
      } else if (p < T_FILL_END) {
        const u = (p - T_FILL_START) / (T_FILL_END - T_FILL_START);
        setPct(Math.round(u * TARGET));
      } else if (p < T_HOLD_END) {
        setPct(TARGET);
      } else {
        const u = (p - T_HOLD_END) / (1 - T_HOLD_END);
        setPct(Math.round(TARGET * (1 - u)));
      }

      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf) return;
      lastShown = -1;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const mo = new MutationObserver(() => {
      if (card.classList.contains("live")) start();
      else stop();
    });
    mo.observe(card, { attributes: true, attributeFilter: ["class"] });
    if (card.classList.contains("live")) start();
  })();

  const animated = document.querySelectorAll(".reveal, .reveal-card, .reveal-title");

  function finalizeStat(el) {
    const raw = el.dataset.count;
    const suffix = el.dataset.suffix || "";
    if (raw === "inf") {
      el.textContent = "∞";
      el.classList.add("is-ready");
      el.closest(".stat")?.classList.add("is-ready");
    } else {
      el.textContent = String(Number(raw) || 0) + suffix;
    }
  }

  // Settle hero entrance animations — clears transform so glass tiles scroll with the hero
  document.querySelectorAll(".hero-identity, .hero-cta, .hero-stats").forEach((el) => {
    const settle = () => el.classList.add("is-in");
    if (reduceMotion) {
      settle();
      return;
    }
    el.addEventListener("animationend", settle, { once: true });
    // Fallback if animation already finished before listener attached
    window.setTimeout(settle, 2400);
  });

  // Hero stats: count-up after CTA cascade (or static if reduced-motion)
  const heroCountEls = [...document.querySelectorAll("[data-hero-stats] [data-count]")];
  const COUNT_DUR = 1500;
  const COUNT_STAGGER = 150;
  // After intro reveal: CTA cascade delay is 1.05s; strip follows at 1.15s
  const COUNT_AFTER_CTA_MS = 1150;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function runHeroCount(el, delay) {
    const raw = el.dataset.count;
    const suffix = el.dataset.suffix || "";

    if (raw === "inf") {
      window.setTimeout(() => {
        el.textContent = "∞";
        el.classList.add("is-ready");
      }, delay);
      return;
    }

    const target = Number(raw) || 0;
    window.setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / COUNT_DUR);
        el.textContent = String(Math.round(target * easeOut(p))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
  }

  function startHeroCounts() {
    if (!heroCountEls.length) return;
    if (reduceMotion) {
      heroCountEls.forEach(finalizeStat);
      return;
    }
    heroCountEls.forEach((el, i) => runHeroCount(el, COUNT_AFTER_CTA_MS + i * COUNT_STAGGER));
  }

  function scheduleHeroCounts() {
    if (document.documentElement.classList.contains("intro-done")) {
      startHeroCounts();
      return;
    }
    document.addEventListener("intro:done", startHeroCounts, { once: true });
  }

  if (reduceMotion) {
    animated.forEach((el) => el.classList.add("in"));
    document.querySelectorAll("[data-count]").forEach(finalizeStat);
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    animated.forEach((el) => revealObserver.observe(el));
    scheduleHeroCounts();
  }
})();

/* ============ PROJECT FILTER + CARD REVEAL + MOBILE LOAD-MORE ============ */
(function initProjectGrid() {
  const filterBar = document.querySelector("[data-filter-bar]");
  const grid = document.querySelector("[data-projects]");
  if (!filterBar || !grid) return;

  const buttons = [...filterBar.querySelectorAll(".f-btn")];
  const projects = [...grid.querySelectorAll(".proj")];
  const track = filterBar.querySelector(".filter-track");
  const ink = filterBar.querySelector("[data-filter-ink]");
  const moreWrap = document.querySelector("[data-work-more]");
  const moreBtn = document.querySelector("[data-work-more-btn]");
  const moreCount = document.querySelector("[data-work-more-count]");
  const moreDone = document.querySelector("[data-work-more-done]");
  const moreTotalEls = document.querySelectorAll("[data-work-more-total]");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mqMobile = matchMedia("(max-width: 767px)");
  const PAGE = 3;
  let busy = false;
  let entered = false;
  let activeFilter = "all";
  let visibleCount = PAGE;

  function moveInk() {
    if (!ink || !track) return;
    const active = filterBar.querySelector(".f-btn.active");
    if (!active) return;
    const tr = track.getBoundingClientRect();
    const ar = active.getBoundingClientRect();
    ink.style.width = `${ar.width}px`;
    ink.style.transform = `translateX(${ar.left - tr.left}px)`;
  }

  function matchedProjects() {
    return projects.filter((p) => activeFilter === "all" || p.dataset.cat === activeFilter);
  }

  function setHighlight() {
    projects.forEach((p) => p.classList.remove("is-highlight"));
    const first = projects.find(
      (p) =>
        !p.classList.contains("is-filtered") &&
        !p.classList.contains("is-page-hidden")
    );
    if (first) first.classList.add("is-highlight");
  }

  function flip(els) {
    if (reduceMotion || !els.length) return;
    const first = new Map(els.map((el) => [el, el.getBoundingClientRect()]));
    return () => {
      els.forEach((el) => {
        const f = first.get(el);
        const l = el.getBoundingClientRect();
        const dx = f.left - l.left;
        const dy = f.top - l.top;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        void el.offsetWidth;
        el.style.transition =
          "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease";
        el.style.transform = "";
        const clear = () => {
          el.style.transition = "";
          el.removeEventListener("transitionend", clear);
        };
        el.addEventListener("transitionend", clear);
      });
    };
  }

  function staggerIn(els) {
    els.forEach((el, i) => {
      el.classList.remove("is-exiting");
      if (reduceMotion) {
        el.classList.add("is-in");
        return;
      }
      el.classList.remove("is-in");
      el.style.transitionDelay = `${i * 80}ms`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add("is-in"));
      });
      window.setTimeout(() => {
        el.style.transitionDelay = "";
      }, 80 * i + 500);
    });
  }

  function updateMoreUI(total, shown) {
    if (!moreWrap) return;
    if (!mqMobile.matches || total <= PAGE) {
      moreWrap.hidden = true;
      return;
    }
    moreWrap.hidden = false;
    moreTotalEls.forEach((el) => {
      el.textContent = String(total);
    });
    const done = shown >= total;
    if (moreBtn) moreBtn.hidden = done;
    if (moreDone) moreDone.hidden = !done;
    if (moreCount) {
      moreCount.textContent = `${Math.min(shown, total)} / ${total}`;
    }
  }

  /** Mobile: paginate matched cards; desktop: show all matched */
  function applyPagination({ animateNew = null } = {}) {
    const matched = matchedProjects();
    const total = matched.length;
    const mobile = mqMobile.matches;
    const limit = mobile ? Math.min(visibleCount, total) : total;

    projects.forEach((p) => {
      const match = matched.includes(p);
      p.classList.toggle("is-filtered", !match);
      if (!match) {
        p.classList.remove("is-page-hidden", "is-exiting");
        return;
      }
      const idx = matched.indexOf(p);
      const show = idx < limit;
      p.classList.toggle("is-page-hidden", mobile && !show);
      if (show) p.classList.remove("is-exiting");
    });

    if (animateNew && animateNew.length) staggerIn(animateNew);
    else {
      matched.slice(0, limit).forEach((p) => {
        if (entered || reduceMotion) p.classList.add("is-in");
      });
    }

    setHighlight();
    updateMoreUI(total, limit);
  }

  function applyFilter(f) {
    if (busy) return;
    activeFilter = f || "all";
    visibleCount = PAGE;

    if (mqMobile.matches) {
      // Reset to first page for this category — no FLIP jank needed
      projects.forEach((p) => {
        p.classList.remove("is-exiting", "is-page-hidden");
        p.classList.remove("is-in");
      });
      applyPagination();
      const shown = matchedProjects().slice(0, Math.min(visibleCount, matchedProjects().length));
      staggerIn(shown);
      entered = true;
      moveInk();
      return;
    }

    const nextShow = matchedProjects();
    const nextHide = projects.filter((p) => !nextShow.includes(p));
    const currentlyShown = projects.filter((p) => !p.classList.contains("is-filtered"));
    const willHide = currentlyShown.filter((p) => nextHide.includes(p));
    const willShow = nextShow.filter((p) => p.classList.contains("is-filtered"));
    const stay = nextShow.filter((p) => !p.classList.contains("is-filtered"));

    if (reduceMotion) {
      projects.forEach((p) => {
        const show = nextShow.includes(p);
        p.classList.toggle("is-filtered", !show);
        p.classList.toggle("is-page-hidden", false);
        p.classList.toggle("is-in", show);
        p.classList.remove("is-exiting");
      });
      setHighlight();
      updateMoreUI(nextShow.length, nextShow.length);
      moveInk();
      return;
    }

    busy = true;
    const playFlip = flip(stay);
    willHide.forEach((p) => p.classList.add("is-exiting"));

    window.setTimeout(() => {
      willHide.forEach((p) => {
        p.classList.add("is-filtered");
        p.classList.remove("is-in", "is-exiting", "is-page-hidden");
      });
      willShow.forEach((p) => {
        p.classList.remove("is-filtered", "is-page-hidden");
        p.classList.remove("is-in");
      });
      setHighlight();
      if (playFlip) playFlip();
      staggerIn(willShow.length ? willShow : nextShow.filter((p) => !p.classList.contains("is-in")));
      stay.forEach((p) => p.classList.add("is-in"));
      updateMoreUI(nextShow.length, nextShow.length);
      busy = false;
      moveInk();
    }, willHide.length ? 280 : 40);
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      moveInk();
      applyFilter(btn.dataset.filter || "all");
    });
  });

  if (moreBtn) {
    moreBtn.addEventListener("click", () => {
      if (!mqMobile.matches || busy) return;
      const matched = matchedProjects();
      const prev = visibleCount;
      visibleCount = Math.min(prev + PAGE, matched.length);
      const newlyShown = matched.slice(prev, visibleCount);
      newlyShown.forEach((p) => {
        p.classList.remove("is-page-hidden", "is-filtered");
        p.classList.remove("is-in");
      });
      staggerIn(newlyShown);
      updateMoreUI(matched.length, visibleCount);
      setHighlight();
    });
  }

  // Initial highlight + ink + mobile page
  applyPagination();
  let inkRaf = 0;
  const syncInk = () => {
    if (inkRaf) return;
    inkRaf = requestAnimationFrame(() => {
      inkRaf = 0;
      moveInk();
    });
  };
  syncInk();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncInk);
  addEventListener("resize", () => {
    syncInk();
    // Crossing the mobile breakpoint: re-apply pagination without resetting filter
    if (!mqMobile.matches) {
      visibleCount = matchedProjects().length || PAGE;
    } else if (visibleCount < PAGE) {
      visibleCount = PAGE;
    }
    applyPagination();
  }, { passive: true });

  // Scroll-in stagger for currently visible cards (once)
  if (reduceMotion) {
    projects
      .filter((p) => !p.classList.contains("is-filtered") && !p.classList.contains("is-page-hidden"))
      .forEach((p) => p.classList.add("is-in"));
    entered = true;
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entered) return;
        entered = true;
        const visible = projects.filter(
          (p) =>
            !p.classList.contains("is-filtered") &&
            !p.classList.contains("is-page-hidden")
        );
        staggerIn(visible);
        io.disconnect();
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  io.observe(grid);
})();

/* ============ PROCESS SECTION (pipeline draw + proof count-up) ============ */
(function initProcessSection() {
  const section = document.getElementById("process");
  if (!section) return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rail = section.querySelector("[data-process-rail]");
  const steps = [...section.querySelectorAll(".process-step")];
  const proofs = [...section.querySelectorAll(".proof-chip")];
  const engages = [...section.querySelectorAll(".engage-card")];
  const countEls = [...section.querySelectorAll("[data-proof-count]")];
  const CHIP_STAGGER = 150;
  const LINE_DELAY = 160;

  function finalizeCounts() {
    countEls.forEach((el) => {
      const target = el.dataset.proofCount || "0";
      const suffix = el.dataset.proofSuffix || "";
      el.textContent = target + suffix;
    });
  }

  function runCounts() {
    if (reduceMotion) {
      finalizeCounts();
      return;
    }
    const DUR = 1400;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    countEls.forEach((el, i) => {
      const target = Number(el.dataset.proofCount) || 0;
      const suffix = el.dataset.proofSuffix || "";
      window.setTimeout(() => {
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - start) / DUR);
          // Number only while counting — suffix lands on the final frame
          if (p < 1) {
            el.textContent = String(Math.round(target * easeOut(p)));
            requestAnimationFrame(tick);
          } else {
            el.textContent = String(target) + suffix;
          }
        };
        requestAnimationFrame(tick);
      }, i * 80);
    });
  }

  function lightPipeline() {
    steps.forEach((step, i) => {
      window.setTimeout(() => {
        step.classList.add("is-lit");
        if (step.classList.contains("is-qa")) {
          const chip = step.querySelector(".process-qa-chip");
          if (chip) {
            chip.classList.remove("is-pulse");
            // Restart one-shot pulse
            void chip.offsetWidth;
            chip.classList.add("is-pulse");
          }
        }
      }, LINE_DELAY + i * CHIP_STAGGER);
    });
  }

  function reveal() {
    steps.forEach((el, i) => {
      window.setTimeout(() => el.classList.add("is-in"), i * 80);
    });
    if (rail) {
      window.setTimeout(() => {
        rail.classList.add("is-drawn");
        lightPipeline();
      }, LINE_DELAY);
    } else {
      lightPipeline();
    }
    proofs.forEach((el, i) => {
      window.setTimeout(() => el.classList.add("is-in"), 80 * steps.length + i * 80);
    });
    engages.forEach((el, i) => {
      window.setTimeout(
        () => el.classList.add("is-in"),
        80 * (steps.length + proofs.length) + i * 80
      );
    });
    window.setTimeout(runCounts, reduceMotion ? 0 : 80 * steps.length);
  }

  if (reduceMotion) {
    steps.forEach((el) => el.classList.add("is-in", "is-lit"));
    proofs.forEach((el) => el.classList.add("is-in"));
    engages.forEach((el) => el.classList.add("is-in"));
    if (rail) rail.classList.add("is-drawn");
    finalizeCounts();
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal();
        io.disconnect();
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
  );
  io.observe(section);
})();

/* ============ 3D TILT CARDS (projects) ============ */
(function initTiltCards() {
  const hoverMq = matchMedia("(hover: hover) and (pointer: fine)");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!hoverMq.matches || reduceMotion) return;

  const MAX_TILT = 8;
  const cards = [...document.querySelectorAll(".proj-card")];

  cards.forEach((card) => {
    if (card.dataset.tiltBound) return;
    card.dataset.tiltBound = "1";
    card.classList.add("tilt-card");

    let glare = card.querySelector(".tilt-glare");
    if (!glare) {
      glare = document.createElement("span");
      glare.className = "tilt-glare";
      glare.setAttribute("aria-hidden", "true");
      card.appendChild(glare);
    }

    let raf = 0;
    let px = 0;
    let py = 0;
    let rect = null;

    const apply = () => {
      raf = 0;
      if (!rect) return;
      const x = (px - rect.left) / Math.max(rect.width, 1);
      const y = (py - rect.top) / Math.max(rect.height, 1);
      const cx = Math.min(1, Math.max(0, x));
      const cy = Math.min(1, Math.max(0, y));
      const rotX = (0.5 - cy) * MAX_TILT * 2;
      const rotY = (cx - 0.5) * MAX_TILT * 2;

      card.style.transform =
        `perspective(900px) rotateX(${rotX.toFixed(2)}deg) ` +
        `rotateY(${rotY.toFixed(2)}deg) translateZ(6px)`;

      glare.style.setProperty("--gx", (cx * 100).toFixed(1) + "%");
      glare.style.setProperty("--gy", (cy * 100).toFixed(1) + "%");
    };

    const reset = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      card.classList.remove("is-tilting");
      card.style.transform = "";
      card.style.willChange = "";
      rect = null;
    };

    card.addEventListener("pointerenter", () => {
      if (!hoverMq.matches) return;
      rect = card.getBoundingClientRect();
      card.classList.add("is-tilting");
      card.style.willChange = "transform";
    });

    card.addEventListener(
      "pointermove",
      (e) => {
        if (!hoverMq.matches) return;
        px = e.clientX;
        py = e.clientY;
        if (!raf) raf = requestAnimationFrame(apply);
      },
      { passive: true }
    );

    card.addEventListener("pointerleave", reset);
  });
})();

