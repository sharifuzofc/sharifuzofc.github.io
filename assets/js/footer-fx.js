"use strict";

/** Lightweight 2D footer: starfield + physics bubbles (max ~40 particles) */
(function initFooterFx() {
  const footer = document.getElementById("footer");
  const canvas = document.getElementById("footer-canvas");
  if (!footer || !canvas) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const MAX_PARTICLES = 40;
  const STAR_COUNT = 22;
  const BUBBLE_COUNT = MAX_PARTICLES - STAR_COUNT; // 18

  const colors = [
    "rgba(56, 189, 248, 0.55)",
    "rgba(125, 211, 252, 0.45)",
    "rgba(14, 165, 233, 0.5)",
    "rgba(2, 132, 199, 0.4)",
    "rgba(186, 230, 253, 0.35)",
  ];

  let w = 0;
  let h = 0;
  let dpr = 1;
  let visible = false;
  let rafId = 0;
  let last = 0;

  const mouse = { x: -9999, y: -9999, active: false };
  const stars = [];
  const bubbles = [];

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const rect = footer.getBoundingClientRect();
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Keep homes roughly in place on resize
    bubbles.forEach((b) => {
      b.homeX = Math.min(w - b.r, Math.max(b.r, b.homeX * (w / (b._w || w))));
      b.homeY = Math.min(h - b.r, Math.max(b.r, b.homeY * (h / (b._h || h))));
      b._w = w;
      b._h = h;
    });
    stars.forEach((s) => {
      s.x = (s.x / (s._w || w)) * w;
      s.y = (s.y / (s._h || h)) * h;
      s._w = w;
      s._h = h;
    });
  }

  function seed() {
    stars.length = 0;
    bubbles.length = 0;

    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.4,
        tw: Math.random() * Math.PI * 2,
        twSpeed: 0.6 + Math.random() * 1.4,
        drift: 4 + Math.random() * 10,
        _w: w,
        _h: h,
      });
    }

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const r = 10 + Math.random() * 22;
      const homeX = r + Math.random() * (w - r * 2);
      const homeY = r + Math.random() * (h - r * 2);
      bubbles.push({
        x: homeX,
        y: homeY,
        homeX,
        homeY,
        vx: 0,
        vy: 0,
        r,
        phase: Math.random() * Math.PI * 2,
        bob: 0.35 + Math.random() * 0.55,
        color: colors[i % colors.length],
        _w: w,
        _h: h,
      });
    }
  }

  function onPointerMove(e) {
    const rect = footer.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  }
  function onPointerLeave() {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  }

  footer.addEventListener("pointermove", onPointerMove, { passive: true });
  footer.addEventListener("pointerleave", onPointerLeave);

  function step(dt) {
    const t = performance.now() * 0.001;

    // Stars — slow drift + twinkle
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x += Math.sin(t * 0.15 + s.tw) * s.drift * dt * 0.15;
      s.y += Math.cos(t * 0.12 + s.tw) * s.drift * dt * 0.1;
      if (s.x < 0) s.x += w;
      if (s.x > w) s.x -= w;
      if (s.y < 0) s.y += h;
      if (s.y > h) s.y -= h;
    }

    // Bubbles — float + spring home + cursor push
    const pushRadius = 120;
    const spring = 2.4;
    const damp = 0.92;
    const pushStrength = 1400;

    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];

      // Gentle float around home
      const floatX = Math.sin(t * b.bob + b.phase) * 14;
      const floatY = Math.cos(t * b.bob * 0.85 + b.phase) * 10;
      const targetX = b.homeX + floatX;
      const targetY = b.homeY + floatY;

      b.vx += (targetX - b.x) * spring * dt;
      b.vy += (targetY - b.y) * spring * dt;

      if (mouse.active) {
        const dx = b.x - mouse.x;
        const dy = b.y - mouse.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        if (dist < pushRadius + b.r) {
          const force = (1 - dist / (pushRadius + b.r)) * pushStrength * dt;
          b.vx += (dx / dist) * force;
          b.vy += (dy / dist) * force;
        }
      }

      b.vx *= damp;
      b.vy *= damp;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Soft bounds
      const pad = b.r + 4;
      if (b.x < pad) { b.x = pad; b.vx *= -0.4; }
      if (b.x > w - pad) { b.x = w - pad; b.vx *= -0.4; }
      if (b.y < pad) { b.y = pad; b.vy *= -0.4; }
      if (b.y > h - pad) { b.y = h - pad; b.vy *= -0.4; }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const t = performance.now() * 0.001;

    // Starfield (behind)
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = 0.25 + (Math.sin(t * s.twSpeed + s.tw) * 0.5 + 0.5) * 0.55;
      ctx.beginPath();
      ctx.fillStyle = `rgba(186, 230, 253, ${a.toFixed(3)})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bubbles
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      const g = ctx.createRadialGradient(
        b.x - b.r * 0.3,
        b.y - b.r * 0.35,
        b.r * 0.1,
        b.x,
        b.y,
        b.r
      );
      g.addColorStop(0, "rgba(224, 242, 254, 0.55)");
      g.addColorStop(0.45, b.color);
      g.addColorStop(1, "rgba(2, 132, 199, 0.05)");
      ctx.beginPath();
      ctx.fillStyle = g;
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      // Soft rim
      ctx.beginPath();
      ctx.strokeStyle = "rgba(125, 211, 252, 0.25)";
      ctx.lineWidth = 1;
      ctx.arc(b.x, b.y, b.r * 0.92, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function loop(now) {
    rafId = 0;
    if (!visible) return;
    if (!last) last = now;
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    step(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (!rafId) {
      last = 0;
      rafId = requestAnimationFrame(loop);
    }
  }
  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    last = 0;
  }

  function onResize() {
    resize();
    if (!stars.length) seed();
  }

  onResize();
  seed();
  addEventListener("resize", onResize);

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        onResize();
        start();
      } else {
        stop();
      }
    },
    { threshold: 0.05 }
  );
  io.observe(footer);
})();
