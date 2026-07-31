"use strict";

(function () {
  if (typeof THREE === "undefined") return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sky = 0x38bdf8;
  const skySoft = 0x7dd3fc;
  const deep = 0x0284c7;
  const ice = 0xe0f2fe;
  const navy = 0x0b1f38;

  function makeRenderer(canvas) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    return renderer;
  }

  function sizeTo(renderer, camera, canvas) {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight || 320;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }

  /** Lazy-init a scene on first view; pause RAF when off-screen */
  function bindVisibleLoop(canvas, build) {
    if (!canvas) return;
    let built = false;
    let visible = false;
    let rafId = 0;
    let tick = null;
    let onResize = null;

    function loop() {
      rafId = 0;
      if (!visible || !tick) return;
      tick();
      rafId = requestAnimationFrame(loop);
    }
    function start() {
      if (!rafId) rafId = requestAnimationFrame(loop);
    }
    function stop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          if (!built) {
            const api = build();
            if (!api) return;
            tick = api.tick;
            onResize = api.onResize;
            built = true;
            if (onResize) {
              onResize();
              addEventListener("resize", onResize);
            }
          }
          start();
        } else {
          stop();
        }
      },
      { threshold: 0.12, rootMargin: "100px 0px" }
    );
    io.observe(canvas.closest(".mini-3d") || canvas);
  }

  function addMiniLights(scene) {
    scene.add(new THREE.AmbientLight(0xbde0fe, 0.7));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(3, 5, 4);
    scene.add(light);
    const fill = new THREE.PointLight(sky, 1.2, 12);
    fill.position.set(-2, 2, 2);
    scene.add(fill);
  }

  /**
   * Drag-to-rotate for expertise mini scenes.
   * Rotates `root` only (Y free, X clamped ±60°), with inertia + auto-spin resume.
   */
  function attachDragRotate(canvas, root) {
    const MAX_PITCH = Math.PI / 3; // ±60°
    const DAMP_FACTOR = 0.05; // OrbitControls-like damping
    const AUTO_SPEED = 0.22; // rad/s when idle auto resumes
    const IDLE_RESUME = 3; // seconds
    const SENS = 0.0055;

    const wrap = canvas.closest(".mini-3d") || canvas;
    const hint = wrap.querySelector(".mini-3d-hint");

    let yaw = 0;
    let pitch = 0;
    let dYaw = 0;
    let dPitch = 0;
    let dragging = false;
    let tracking = false; // touch: pointer down, not yet scroll vs rotate
    let autoOn = true;
    let idle = 0;
    let lastX = 0;
    let lastY = 0;
    let startX = 0;
    let startY = 0;
    let hinted = false;
    let activePointer = null;

    canvas.style.touchAction = "pan-y";
    wrap.classList.add("is-interactive-3d");

    function hideHint() {
      if (hinted || !hint) return;
      hinted = true;
      hint.classList.add("is-gone");
    }

    function beginDrag(e) {
      dragging = true;
      tracking = false;
      hideHint();
      autoOn = false;
      idle = 0;
      dYaw = 0;
      dPitch = 0;
      wrap.classList.add("is-dragging");
      activePointer = e.pointerId;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (_) { /* ignore */ }
    }

    function applyDelta(dx, dy) {
      const ay = dx * SENS;
      const ap = dy * SENS;
      yaw += ay;
      pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch + ap));
      dYaw = ay;
      dPitch = ap;
      idle = 0;
      autoOn = false;
    }

    function onDown(e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      autoOn = false;
      idle = 0;
      dYaw = 0;
      dPitch = 0;
      if (e.pointerType === "mouse" || e.pointerType === "pen") {
        beginDrag(e);
      } else {
        // Touch: wait to distinguish vertical page scroll vs rotate
        tracking = true;
        dragging = false;
      }
    }

    function onMove(e) {
      if (activePointer != null && e.pointerId !== activePointer && dragging) return;
      if (!tracking && !dragging) return;

      if (tracking && !dragging) {
        const adx = Math.abs(e.clientX - startX);
        const ady = Math.abs(e.clientY - startY);
        if (adx < 8 && ady < 8) return;
        // Prefer vertical page scroll when gesture is mostly vertical
        if (ady > adx * 1.15) {
          tracking = false;
          return;
        }
        beginDrag(e);
      }

      if (!dragging) return;
      if (e.cancelable) e.preventDefault();

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      applyDelta(dx, dy);
    }

    function onUp(e) {
      if (activePointer != null && e.pointerId !== activePointer) return;
      if (!tracking && !dragging) return;
      tracking = false;
      if (dragging) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch (_) { /* ignore */ }
      }
      dragging = false;
      activePointer = null;
      wrap.classList.remove("is-dragging");
      idle = 0;
      autoOn = false;
    }

    canvas.addEventListener("pointerdown", onDown, { passive: true });
    canvas.addEventListener("pointermove", onMove, { passive: false });
    canvas.addEventListener("pointerup", onUp, { passive: true });
    canvas.addEventListener("pointercancel", onUp, { passive: true });
    canvas.addEventListener("lostpointercapture", () => {
      dragging = false;
      tracking = false;
      activePointer = null;
      wrap.classList.remove("is-dragging");
    });

    return {
      /** Call once per frame with delta seconds */
      update(dt) {
        const d = Math.min(Math.max(dt, 0), 0.05);
        if (!dragging) {
          // Inertia (OrbitControls-style damping on residual deltas)
          if (Math.abs(dYaw) > 1e-5 || Math.abs(dPitch) > 1e-5) {
            yaw += dYaw;
            pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch + dPitch));
            const decay = Math.pow(1 - DAMP_FACTOR, d * 60);
            dYaw *= decay;
            dPitch *= decay;
            idle = 0;
          } else {
            dYaw = 0;
            dPitch = 0;
            idle += d;
            if (idle >= IDLE_RESUME) autoOn = true;
          }
          if (autoOn) yaw += AUTO_SPEED * d;
        }

        root.rotation.order = "YXZ";
        root.rotation.y = yaw;
        root.rotation.x = pitch;
      },
    };
  }

  /*
   * Hero 3D — glass-instrument family (Awwwards SOTD / Apple product-page glass):
   * 1) One shared frosted-glass body recipe for every object — color lives only in accents.
   * 2) Edge catch-light (clearcoat + cool rim) sells premium glass; size never compensates.
   * 3) Sparse silhouettes beat busy chrome: one accent emissive + soft sprite glow each.
   * 4) Transmission looks richest but costs a pass/object — r128 + <8ms budget → opacity glass.
   */
  function initHero() {
    const canvas = document.getElementById("hero-canvas");
    const heroEl = document.getElementById("home") || canvas?.closest(".hero");
    if (!canvas) return;

    // Mobile / narrow: static aurora CSS fallback — no WebGL cost
    const mobileMq = matchMedia("(max-width: 767px)");
    if (mobileMq.matches) {
      canvas.style.display = "none";
      if (heroEl) heroEl.classList.add("hero--aurora");
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.4, 8.5);

    const renderer = makeRenderer(canvas);
    const group = new THREE.Group();
    scene.add(group);
    group.rotation.set(0, 0, 0);

    // Soft env map — glass edge reflections (Apple-style product rig)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x070b14);
    [
      [0xffffff, [5, 4, 3]],
      [0xe0f2fe, [-4, 2, -2]],
      [0x38bdf8, [2, -3, 4]],
      [0x94a3b8, [-2, 5, -3]],
    ].forEach(([hex, pos]) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 10, 10),
        new THREE.MeshBasicMaterial({ color: hex })
      );
      m.position.set(pos[0], pos[1], pos[2]);
      envScene.add(m);
    });
    const envMap = pmrem.fromScene(envScene, 0.04).texture;
    scene.environment = envMap;
    pmrem.dispose();
    envScene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });

    /* Light rig — key + rim + ambient only (no warm / extra fills) */
    scene.add(new THREE.AmbientLight(0x9bb8d4, 0.42));
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(4.5, 6.5, 3.5); /* soft top-right */
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xf0f9ff, 0.65);
    rim.position.set(-4.5, 2.5, -3.5); /* cool back-left — glass edge catch */
    scene.add(rim);

    const DEG = Math.PI / 180;
    /* ~180px visual diameter at 1440 → ~1.4 world units (FOV 45 @ z 8.5) */
    const UNIT = 1.0;

    /*
     * Shared body: frosted dark glass.
     * Ideal: transmission:.85 / thickness:1.2 / ior:1.4 — unavailable on r128
     * and too costly for 4 mid-layer meshes under an 8ms render budget.
     * Fallback (measured OK): transparent clearcoat glass with navy tint.
     */
    const matGlass = new THREE.MeshPhysicalMaterial({
      color: 0x1a2f4a,
      metalness: 0.04,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.38,
      envMapIntensity: 1.35,
      side: THREE.FrontSide,
    });
    const matGlassBg = new THREE.MeshPhysicalMaterial({
      color: 0x152a42,
      metalness: 0.02,
      roughness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      transparent: true,
      opacity: 0.22,
      envMapIntensity: 0.7,
      side: THREE.FrontSide,
    });

    /* Discipline accents — MeshBasic + soft sprite glow (no postprocessing) */
    const emitCyan = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const emitGreen = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const emitViolet = new THREE.MeshBasicMaterial({ color: 0xa78bfa });
    const emitOrange = new THREE.MeshBasicMaterial({ color: 0xff8a1f }); /* hot orange — matches green-check pop */

    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = glowCanvas.height = 64;
    {
      const g = glowCanvas.getContext("2d");
      const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, "rgba(255,255,255,0.85)");
      grd.addColorStop(0.35, "rgba(255,255,255,0.28)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 64, 64);
    }
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const makeGlow = (hex, scale = 0.85) => {
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color: hex,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      spr.scale.set(scale, scale, 1);
      return spr;
    };

    const countTris = (root) => {
      let n = 0;
      root.traverse((o) => {
        const g = o.geometry;
        if (!g) return;
        if (g.index) n += g.index.count / 3;
        else if (g.attributes.position) n += g.attributes.position.count / 3;
      });
      return Math.round(n);
    };

    const roundedRectShape = (w, h, r) => {
      const s = new THREE.Shape();
      const x = -w / 2;
      const y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    };

    const attachMotion = (obj, opts) => {
      /* Preserve accent/discipline fields set on the group before attach */
      const prev = obj.userData || {};
      obj.userData = {
        ...prev,
        baseX: opts.x,
        baseY: opts.y,
        baseZ: opts.z,
        depthFactor: opts.depth ?? 0.75,
        spinX: opts.spinX ?? 0,
        spinY: opts.spinY ?? 0,
        spinZ: opts.spinZ ?? 0,
        rotX0: opts.rotX0 ?? 0,
        rotY0: opts.rotY0 ?? 0,
        rotZ0: opts.rotZ0 ?? 0,
        bobFreq: opts.bobFreq ?? 0.55,
        bobAmp: opts.bobAmp ?? 0.1, // ~±10px visual
        phase: opts.phase ?? Math.random() * Math.PI * 2,
        parallaxX: 0,
        parallaxY: 0,
        boost: 0,
        boostTarget: 0,
        ...opts.extra,
      };
      obj.position.set(opts.x, opts.y, opts.z);
      obj.rotation.set(obj.userData.rotX0, obj.userData.rotY0, obj.userData.rotZ0);
      group.add(obj);
      return obj;
    };

    /* ========== 1) WEB — glass screen + cyan chart accent ========== */
    const web = new THREE.Group();
    {
      const screen = new THREE.Mesh(
        new THREE.ExtrudeGeometry(roundedRectShape(1.15 * UNIT, 0.78 * UNIT, 0.1), {
          depth: 0.07,
          bevelEnabled: true,
          bevelThickness: 0.02,
          bevelSize: 0.018,
          bevelSegments: 1,
          curveSegments: 6,
        }),
        matGlass
      );
      screen.position.z = -0.035;
      web.add(screen);

      const chartPts = [
        new THREE.Vector3(-0.38, -0.14, 0.06),
        new THREE.Vector3(-0.16, 0.02, 0.06),
        new THREE.Vector3(0.02, 0.16, 0.06),
        new THREE.Vector3(0.18, 0.04, 0.06),
        new THREE.Vector3(0.4, 0.2, 0.06),
      ];
      const chart = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(chartPts), 24, 0.018, 5, false),
        emitCyan
      );
      web.add(chart);
      const glow = makeGlow(0x22d3ee, 0.95);
      glow.position.set(0.05, 0.05, 0.12);
      web.add(glow);
      web.userData.discipline = "web";
      web.userData.glow = glow;
      web.userData.glowBaseOp = glow.material.opacity;
      web.userData.glowBaseScale = glow.scale.x;
      web.userData.accentMeshes = [chart];
    }
    attachMotion(web, {
      /* Outer third — ~14%x / 24%y @ 1440 (center clear of mesh radius) */
      x: -4.55,
      y: 2.15,
      z: -0.9,
      depth: 0.38,
      bobFreq: 0.48,
      bobAmp: 0.1,
      phase: 0.4,
      rotY0: -0.1,
      rotX0: 0.08,
      spinY: 0.045,
      spinX: 0.02,
    });

    /* ========== 2) SQA — solid glass shield + green check ========== */
    const sqa = new THREE.Group();
    {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.52 * UNIT);
      shape.bezierCurveTo(0.38 * UNIT, 0.45 * UNIT, 0.42 * UNIT, 0.1 * UNIT, 0.42 * UNIT, -0.05 * UNIT);
      shape.lineTo(0, -0.55 * UNIT);
      shape.lineTo(-0.42 * UNIT, -0.05 * UNIT);
      shape.bezierCurveTo(-0.42 * UNIT, 0.1 * UNIT, -0.38 * UNIT, 0.45 * UNIT, 0, 0.52 * UNIT);
      const shield = new THREE.Mesh(
        new THREE.ExtrudeGeometry(shape, {
          depth: 0.12,
          bevelEnabled: true,
          bevelThickness: 0.028,
          bevelSize: 0.022,
          bevelSegments: 1,
          curveSegments: 10,
        }),
        matGlass
      );
      shield.position.z = -0.06;
      sqa.add(shield);

      const checkPts = [
        new THREE.Vector3(-0.18, -0.02, 0.14),
        new THREE.Vector3(-0.02, -0.16, 0.14),
        new THREE.Vector3(0.22, 0.18, 0.14),
      ];
      const check = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(checkPts), 14, 0.028, 5, false),
        emitGreen
      );
      sqa.add(check);
      const glow = makeGlow(0x34d399, 0.9);
      glow.position.set(0, 0, 0.2);
      sqa.add(glow);
      sqa.userData.discipline = "sqa";
      sqa.userData.glow = glow;
      sqa.userData.glowBaseOp = glow.material.opacity;
      sqa.userData.glowBaseScale = glow.scale.x;
      sqa.userData.accentMeshes = [check];
    }
    attachMotion(sqa, {
      /* Outer third — ~86%x / 22%y @ 1440 */
      x: 4.55,
      y: 2.25,
      z: -0.4,
      depth: 0.38,
      bobFreq: 0.42,
      bobAmp: 0.1,
      phase: 1.7,
      rotY0: 0.1,
      spinY: 0.055,
      spinZ: 0.02,
    });

    /* ========== 3) DESIGN — glass Bézier pen curve (no crystal) ========== */
    const design = new THREE.Group();
    {
      /*
       * Calligraphy S: many soft samples + low tension — continuous stroke,
       * never a 4-point zigzag that reads as "N".
       */
      const penCurve = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-0.52 * UNIT, -0.28 * UNIT, 0.02),
          new THREE.Vector3(-0.42 * UNIT, 0.02 * UNIT, 0.05),
          new THREE.Vector3(-0.28 * UNIT, 0.38 * UNIT, 0.08),
          new THREE.Vector3(-0.08 * UNIT, 0.48 * UNIT, 0.06), /* upper lobe */
          new THREE.Vector3(0.06 * UNIT, 0.22 * UNIT, 0.02),
          new THREE.Vector3(0.1 * UNIT, -0.08 * UNIT, -0.02), /* soft spine */
          new THREE.Vector3(0.2 * UNIT, -0.38 * UNIT, -0.04),
          new THREE.Vector3(0.38 * UNIT, -0.4 * UNIT, 0.0), /* lower lobe */
          new THREE.Vector3(0.5 * UNIT, -0.08 * UNIT, 0.04),
          new THREE.Vector3(0.46 * UNIT, 0.62 * UNIT, 0.08), /* top anchor lifted */
        ],
        false,
        "catmullrom",
        0.25
      );
      design.add(
        new THREE.Mesh(new THREE.TubeGeometry(penCurve, 64, 0.046, 8, false), matGlass)
      );
      const a0 = penCurve.getPoint(0);
      const a1 = penCurve.getPoint(1);
      const ballA = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), matGlass);
      ballA.position.copy(a0);
      design.add(ballA);
      /* One emissive violet accent at the high far anchor */
      const ballB = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), emitViolet);
      ballB.position.copy(a1);
      design.add(ballB);
      const glow = makeGlow(0xa78bfa, 0.75);
      glow.position.copy(a1);
      glow.position.z += 0.05;
      design.add(glow);
      design.userData.discipline = "design";
      design.userData.glow = glow;
      design.userData.glowBaseOp = glow.material.opacity;
      design.userData.glowBaseScale = glow.scale.x;
      design.userData.accentMeshes = [ballB];
    }
    attachMotion(design, {
      /* Outer third — ~11%x / 76%y — mesh clears switcher/stats */
      x: -4.85,
      y: -1.7,
      z: -0.8,
      depth: 0.36,
      bobFreq: 0.5,
      bobAmp: 0.1,
      phase: 2.9,
      spinZ: 0.04,
      spinY: 0.028,
      rotX0: 0.18,
      rotY0: 0.12,
      rotZ0: -0.55, /* lay the S on its side — stroke, not letterform */
    });

    /* ========== 4) VIDEO — glass play chip in a tight glass ring ========== */
    const video = new THREE.Group();
    {
      /* Thin ring — radius tight to the triangle, not a giant hoop */
      video.add(new THREE.Mesh(new THREE.TorusGeometry(0.4 * UNIT, 0.028, 10, 36), matGlass));

      const tri = new THREE.Shape();
      tri.moveTo(-0.14, -0.15);
      tri.quadraticCurveTo(-0.16, 0, -0.14, 0.15);
      tri.quadraticCurveTo(0.02, 0.02, 0.2, 0);
      tri.quadraticCurveTo(0.02, -0.02, -0.14, -0.15);
      /* Glass underlayer (family material) */
      const playGlass = new THREE.Mesh(
        new THREE.ExtrudeGeometry(tri, {
          depth: 0.06,
          bevelEnabled: true,
          bevelThickness: 0.014,
          bevelSize: 0.01,
          bevelSegments: 1,
        }),
        matGlass
      );
      playGlass.position.set(-0.02, 0, -0.05);
      video.add(playGlass);

      /* Solid emissive fill in front — same readability as green check */
      const playEmit = new THREE.Mesh(
        new THREE.ExtrudeGeometry(tri, {
          depth: 0.05,
          bevelEnabled: true,
          bevelThickness: 0.012,
          bevelSize: 0.01,
          bevelSegments: 1,
        }),
        emitOrange
      );
      playEmit.position.set(-0.02, 0, 0.04);
      playEmit.scale.setScalar(0.92);
      video.add(playEmit);

      const glow = makeGlow(0xff8a1f, 1.15);
      glow.material.opacity = 0.72;
      glow.position.set(0.02, 0, 0.14);
      video.add(glow);
      video.userData.discipline = "video";
      video.userData.glow = glow;
      video.userData.glowBaseOp = glow.material.opacity;
      video.userData.glowBaseScale = glow.scale.x;
      video.userData.accentMeshes = [playEmit];
    }
    attachMotion(video, {
      /* Outer third — ~89%x / 73%y @ 1440 */
      x: 4.85,
      y: -1.5,
      z: -0.35,
      depth: 0.36,
      bobFreq: 0.46,
      bobAmp: 0.1,
      phase: 4.1,
      rotZ0: 0,
      /* Z-only wobble ±15° — triangle stays recognizable */
      extra: { spinAmpZ: 15 * DEG, spinFreqZ: 0.45, faceLock: true },
    });

    /* Far depth glass planes — corner accents, not stacked under mains */
    const bgCubes = [];
    const bgPlane = new THREE.PlaneGeometry(0.75, 0.5);
    [
      { x: -4.2, y: 2.65, z: -2.95, s: 1.05, rx: 0.4, ry: 0.6 },
      { x: 4.25, y: -2.55, z: -3.05, s: 0.9, rx: -0.3, ry: -0.5 },
      { x: 4.05, y: 2.7, z: -3.15, s: 0.7, rx: 0.5, ry: 0.2 },
      { x: -4.1, y: -2.7, z: -2.9, s: 0.85, rx: -0.2, ry: 0.7 },
    ].forEach((p, i) => {
      const mesh = new THREE.Mesh(bgPlane, matGlassBg.clone());
      mesh.scale.setScalar(p.s);
      attachMotion(mesh, {
        x: p.x,
        y: p.y,
        z: p.z,
        depth: 0.25,
        spinX: 0.03 * (i % 2 ? -1 : 1),
        spinY: 0.04,
        bobFreq: 0.32,
        bobAmp: 0.05,
        phase: i * 1.3,
        rotX0: p.rx,
        rotY0: p.ry,
        extra: { baseOpacity: 0.22, isBg: true },
      });
      bgCubes.push(mesh);
    });

    const stars = [web, sqa, design, video];
    const white = new THREE.Color(0xffffff);
    stars.forEach((s) => {
      const meshes = s.userData.accentMeshes || [];
      s.userData.accentBaseColors = meshes.map((m) =>
        m.material && m.material.color ? m.material.color.clone() : new THREE.Color(0xffffff)
      );
      s.userData.accentBaseScales = meshes.map((m) => m.scale.x);
    });

    window.__hero3dSetDiscipline = (id) => {
      stars.forEach((s) => {
        s.userData.boostTarget = s.userData.discipline === id ? 1 : 0;
      });
    };
    window.addEventListener("hero:discipline", (e) => {
      const id = e && e.detail && e.detail.id;
      if (id) window.__hero3dSetDiscipline(id);
    });
    /* Sync if switcher already announced before scene ready */
    const bootId =
      document.querySelector(".hero-switcher-track")?.dataset?.active || "web";
    window.__hero3dSetDiscipline(bootId);

    const applyAccentBoost = (s, tBoost) => {
      const u = s.userData;
      if (u.glow) {
        u.glow.material.opacity = (u.glowBaseOp || 0.5) * (1 + 0.3 * tBoost);
        const sc = (u.glowBaseScale || 0.9) * (1 + 0.12 * tBoost);
        u.glow.scale.set(sc, sc, 1);
      }
      const meshes = u.accentMeshes || [];
      meshes.forEach((m, i) => {
        const base = u.accentBaseColors && u.accentBaseColors[i];
        if (base && m.material && m.material.color) {
          m.material.color.copy(base).lerp(white, 0.22 * tBoost);
        }
        const bs = (u.accentBaseScales && u.accentBaseScales[i]) || 1;
        m.scale.setScalar(bs * (1 + 0.08 * tBoost));
      });
    };

    const triCount = countTris(group);
    window.__hero3dStats = { triangles: triCount, frameMsAvg: null, material: "frosted-opacity-glass" };

    // Slow fade-in
    canvas.style.opacity = "0";
    canvas.style.transition = "opacity 1.4s ease";
    requestAnimationFrame(() => {
      canvas.style.opacity = "1";
    });

    const lerp = (a, b, t) => a + (b - a) * t;
    const TILT_MAX = 4 * DEG;
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

    // Reduced motion: static render once (no rotation / float)
    if (reduceMotion) {
      const paint = () => {
        stars.forEach((s) => {
          s.userData.boost = s.userData.boostTarget || 0;
          applyAccentBoost(s, s.userData.boost);
        });
        sizeTo(renderer, camera, canvas);
        renderer.render(scene, camera);
      };
      const prevSet = window.__hero3dSetDiscipline;
      window.__hero3dSetDiscipline = (id) => {
        if (typeof prevSet === "function") prevSet(id);
        paint();
      };
      paint();
      addEventListener("resize", paint);
      return;
    }

    const pointerTarget = { x: 0, y: 0 };
    const pointerSmooth = { x: 0, y: 0 };
    let scrollTarget = 0;
    let scrollSmooth = 0;
    let idleTime = 0;
    let inView = true;
    let tabActive = !document.hidden;
    let rafId = 0;
    let frameAcc = 0;
    let frameSamples = 0;

    const onPointerMove = (e) => {
      if (!finePointer) return;
      pointerTarget.x = (e.clientX / innerWidth) * 2 - 1;
      pointerTarget.y = (e.clientY / innerHeight) * 2 - 1;
      idleTime = 0;
    };
    if (finePointer) {
      addEventListener("pointermove", onPointerMove, { passive: true });
    }

    const onScroll = () => {
      if (!heroEl) {
        scrollTarget = Math.min(1, Math.max(0, scrollY / (innerHeight * 0.9)));
        return;
      }
      const rect = heroEl.getBoundingClientRect();
      const h = Math.max(rect.height, 1);
      scrollTarget = Math.min(1, Math.max(0, -rect.top / h));
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const clock = new THREE.Clock();
    const _unprojOrigin = new THREE.Vector3();
    const _unprojTarget = new THREE.Vector3();
    const _exclTL = new THREE.Vector3();
    const _exclBR = new THREE.Vector3();
    const exclusion = { minX: -1.7, maxX: 1.7, minY: -2.0, maxY: 2.0, ready: false };
    const contentEl = heroEl.querySelector(".hero-content");

    /* Screen → world on a constant-z plane (for no-spawn box) */
    function clientToWorldAtZ(clientX, clientY, worldZ, out) {
      const rect = canvas.getBoundingClientRect();
      const ndcX = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const ndcY = -((clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
      camera.getWorldPosition(_unprojOrigin);
      _unprojTarget.set(ndcX, ndcY, 0.5).unproject(camera);
      _unprojTarget.sub(_unprojOrigin);
      if (Math.abs(_unprojTarget.z) < 1e-5) {
        out.set(0, 0, worldZ);
        return out;
      }
      const tHit = (worldZ - _unprojOrigin.z) / _unprojTarget.z;
      out.set(
        _unprojOrigin.x + _unprojTarget.x * tHit,
        _unprojOrigin.y + _unprojTarget.y * tHit,
        worldZ
      );
      return out;
    }

    function updateExclusionBox() {
      if (!contentEl) {
        exclusion.ready = false;
        return;
      }
      const r = contentEl.getBoundingClientRect();
      const margin = 60;
      const zPlane = -0.5;
      clientToWorldAtZ(r.left - margin, r.top - margin, zPlane, _exclTL);
      clientToWorldAtZ(r.right + margin, r.bottom + margin, zPlane, _exclBR);
      exclusion.minX = Math.min(_exclTL.x, _exclBR.x);
      exclusion.maxX = Math.max(_exclTL.x, _exclBR.x);
      exclusion.minY = Math.min(_exclTL.y, _exclBR.y);
      exclusion.maxY = Math.max(_exclTL.y, _exclBR.y);
      exclusion.ready = true;
    }

    function onResize() {
      sizeTo(renderer, camera, canvas);
      updateExclusionBox();
    }
    onResize();
    addEventListener("resize", onResize);

    function placeObject(m, t, fade, ease) {
      const u = m.userData;
      const depthMul = 0.35 + u.depthFactor * 0.65;
      const bob = Math.sin(t * u.bobFreq + u.phase) * u.bobAmp * depthMul;

      /* Lower drift near center — depthFactor already reduced for mains */
      const px = -pointerSmooth.x * 0.18 * u.depthFactor;
      const py = pointerSmooth.y * 0.12 * u.depthFactor;
      u.parallaxX = lerp(u.parallaxX, px, ease);
      u.parallaxY = lerp(u.parallaxY, py, ease);

      let x = u.baseX + u.parallaxX;
      let y = u.baseY + bob + u.parallaxY;
      const z = u.baseZ - scrollSmooth * 0.35 * u.depthFactor;

      /* Eject only if center enters content AABB (already includes +60px) */
      if (u.discipline && exclusion.ready) {
        const pad = 0.35;
        if (
          x > exclusion.minX &&
          x < exclusion.maxX &&
          y > exclusion.minY &&
          y < exclusion.maxY
        ) {
          x = u.baseX < 0 ? exclusion.minX - pad : exclusion.maxX + pad;
          y = u.baseY < 0 ? exclusion.minY - pad : exclusion.maxY + pad;
        }
      }

      m.position.x = x;
      m.position.y = y;
      m.position.z = z;

      if (u.isBg && m.material && u.baseOpacity != null) {
        m.material.opacity = u.baseOpacity * fade;
      }
    }

    function tick() {
      rafId = 0;
      if (!inView || !tabActive) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      const ease = 1 - Math.exp(-2.2 * dt);
      const scrollEase = 1 - Math.exp(-3 * dt);

      idleTime += dt;
      if (idleTime > 1.8) {
        pointerTarget.x = lerp(pointerTarget.x, 0, 1 - Math.exp(-1.4 * dt));
        pointerTarget.y = lerp(pointerTarget.y, 0, 1 - Math.exp(-1.4 * dt));
      }

      pointerSmooth.x = lerp(pointerSmooth.x, pointerTarget.x, ease);
      pointerSmooth.y = lerp(pointerSmooth.y, pointerTarget.y, ease);
      scrollSmooth = lerp(scrollSmooth, scrollTarget, scrollEase);
      const fade = 1 - scrollSmooth * 0.9;

      /* Recompute no-spawn from live content rect (badge→stats + 60px) */
      updateExclusionBox();

      /* ~400ms settle for active-discipline emissive boost */
      const boostEase = 1 - Math.exp(-dt * 7.5);

      stars.forEach((s) => {
        const u = s.userData;
        placeObject(s, t, fade, ease);
        /* Continuous spin OR limited wobble (keeps silhouettes readable) */
        if (u.faceLock || u.spinAmpZ != null || u.spinAmpY != null) {
          s.rotation.x = u.rotX0 + (u.spinAmpX ? Math.sin(t * (u.spinFreqX || 0.4)) * u.spinAmpX : 0);
          s.rotation.y = u.rotY0 + (u.spinAmpY ? Math.sin(t * (u.spinFreqY || 0.4)) * u.spinAmpY : 0);
          s.rotation.z = u.rotZ0 + (u.spinAmpZ ? Math.sin(t * (u.spinFreqZ || 0.4)) * u.spinAmpZ : t * u.spinZ);
        } else {
          s.rotation.x = u.rotX0 + t * u.spinX;
          s.rotation.y = u.rotY0 + t * u.spinY;
          s.rotation.z = u.rotZ0 + t * u.spinZ;
        }
        u.boost = lerp(u.boost || 0, u.boostTarget || 0, boostEase);
        applyAccentBoost(s, u.boost);
      });

      bgCubes.forEach((c) => {
        const u = c.userData;
        placeObject(c, t, fade, ease);
        c.rotation.x = u.rotX0 + t * u.spinX;
        c.rotation.y = u.rotY0 + t * u.spinY;
      });

      if (window.__hero3dStats) {
        window.__hero3dStats.objects = stars.map((s) => ({
          id: s.userData.discipline,
          x: +s.position.x.toFixed(2),
          y: +s.position.y.toFixed(2),
          z: +s.position.z.toFixed(2),
        }));
        window.__hero3dStats.exclusion = exclusion.ready
          ? {
              minX: +exclusion.minX.toFixed(2),
              maxX: +exclusion.maxX.toFixed(2),
              minY: +exclusion.minY.toFixed(2),
              maxY: +exclusion.maxY.toFixed(2),
            }
          : null;
      }

      const tiltY = pointerSmooth.x * TILT_MAX;
      const tiltX = -pointerSmooth.y * TILT_MAX * 0.75;
      group.rotation.y = lerp(group.rotation.y, tiltY, ease);
      group.rotation.x = lerp(group.rotation.x, tiltX, ease);

      camera.position.x = lerp(camera.position.x, pointerSmooth.x * 0.12, ease);
      camera.position.y = lerp(camera.position.y, 0.4 - pointerSmooth.y * 0.08, ease);
      camera.lookAt(0, 0.05, 0);

      /* Measure render cost only (not RAF cadence / compositor) */
      const t0 = performance.now();
      renderer.render(scene, camera);
      const renderMs = performance.now() - t0;
      if (frameSamples < 90) {
        frameAcc += renderMs;
        frameSamples += 1;
        if (frameSamples === 90) {
          window.__hero3dStats = {
            triangles: triCount,
            frameMsAvg: Math.round((frameAcc / 90) * 100) / 100,
          };
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (!rafId && inView && tabActive) {
        clock.getDelta();
        rafId = requestAnimationFrame(tick);
      }
    }
    function stop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { threshold: 0.05 }
    );
    io.observe(heroEl || canvas);

    document.addEventListener("visibilitychange", () => {
      tabActive = !document.hidden;
      if (tabActive) start();
      else stop();
    });

    start();
  }

  /* ---------- WEB-APP: wireframe laptop + floating </> ---------- */
  function initWeb() {
    bindVisibleLoop(document.getElementById("web-canvas"), () => {
      const canvas = document.getElementById("web-canvas");
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
      camera.position.set(0, 0.55, 6.2);
      const renderer = makeRenderer(canvas);
      const root = new THREE.Group();
      scene.add(root);
      addMiniLights(scene);

      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a5f,
        metalness: 0.55,
        roughness: 0.35,
      });
      const screenMat = new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        metalness: 0.45,
        roughness: 0.25,
        emissive: deep,
        emissiveIntensity: 0.2,
        wireframe: true,
      });
      const accentMat = new THREE.MeshStandardMaterial({
        color: sky,
        metalness: 0.5,
        roughness: 0.3,
        emissive: sky,
        emissiveIntensity: 0.25,
      });

      // Laptop base + screen
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.55), bodyMat);
      base.position.y = -0.55;
      root.add(base);
      const hinge = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.08, 0.12), bodyMat);
      hinge.position.set(0, -0.42, -0.72);
      root.add(hinge);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.35, 0.08), screenMat);
      screen.position.set(0, 0.35, -0.85);
      screen.rotation.x = -0.4;
      root.add(screen);
      const bezel = new THREE.Mesh(
        new THREE.BoxGeometry(2.25, 1.4, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x0b1f38, metalness: 0.4, roughness: 0.4 })
      );
      bezel.position.set(0, 0.35, -0.9);
      bezel.rotation.x = -0.4;
      root.add(bezel);

      // Floating </> brackets
      function makeAngle(dir) {
        const g = new THREE.Group();
        const a = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 0.12), accentMat);
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 0.12), accentMat);
        a.rotation.z = dir * 0.7;
        b.rotation.z = -dir * 0.7;
        a.position.set(dir * -0.18, 0.28, 0);
        b.position.set(dir * -0.18, -0.28, 0);
        g.add(a, b);
        return g;
      }
      const left = makeAngle(1);
      left.position.set(-1.55, 0.7, 0.9);
      root.add(left);
      const right = makeAngle(-1);
      right.position.set(1.55, 0.55, 0.9);
      root.add(right);
      const slash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.15, 0.12), accentMat);
      slash.rotation.z = -0.45;
      slash.position.set(0.05, 1.15, 1.1);
      root.add(slash);

      const drag = attachDragRotate(canvas, root);
      const clock = new THREE.Clock();
      return {
        onResize: () => sizeTo(renderer, camera, canvas),
        tick: () => {
          const dt = clock.getDelta();
          const t = clock.elapsedTime;
          drag.update(dt);
          left.position.y = 0.7 + Math.sin(t * 1.6) * 0.12;
          right.position.y = 0.55 + Math.sin(t * 1.6 + 1) * 0.12;
          slash.position.y = 1.15 + Math.sin(t * 2) * 0.08;
          slash.rotation.y = t * 0.8;
          screen.rotation.x = -0.4 + Math.sin(t * 0.8) * 0.04;
          bezel.rotation.x = screen.rotation.x;
          renderer.render(scene, camera);
        },
      };
    });
  }

  /* ---------- SQA: shield + checkmark + orbiting cubes ---------- */
  function initSqa() {
    bindVisibleLoop(document.getElementById("sqa-canvas"), () => {
      const canvas = document.getElementById("sqa-canvas");
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
      camera.position.set(0, 0.35, 6.2);
      const renderer = makeRenderer(canvas);
      const root = new THREE.Group();
      scene.add(root);
      addMiniLights(scene);

      const shape = new THREE.Shape();
      shape.moveTo(0, 1.35);
      shape.bezierCurveTo(1.05, 1.15, 1.15, 0.35, 1.15, -0.1);
      shape.lineTo(0, -1.45);
      shape.lineTo(-1.15, -0.1);
      shape.bezierCurveTo(-1.15, 0.35, -1.05, 1.15, 0, 1.35);

      const shield = new THREE.Mesh(
        new THREE.ExtrudeGeometry(shape, {
          depth: 0.22,
          bevelEnabled: true,
          bevelThickness: 0.06,
          bevelSize: 0.05,
          bevelSegments: 2,
        }),
        new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          metalness: 0.55,
          roughness: 0.3,
          emissive: deep,
          emissiveIntensity: 0.2,
        })
      );
      shield.position.z = -0.11;
      root.add(shield);

      // Checkmark
      const checkMat = new THREE.MeshStandardMaterial({
        color: ice,
        metalness: 0.4,
        roughness: 0.25,
        emissive: skySoft,
        emissiveIntensity: 0.15,
      });
      const short = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), checkMat);
      short.position.set(-0.28, -0.15, 0.25);
      short.rotation.z = 0.7;
      root.add(short);
      const long = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.05, 0.18), checkMat);
      long.position.set(0.25, 0.05, 0.25);
      long.rotation.z = -0.65;
      root.add(long);

      const orbit = new THREE.Group();
      root.add(orbit);
      const cubes = [];
      for (let i = 0; i < 7; i++) {
        const c = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.22, 0.22),
          new THREE.MeshStandardMaterial({
            color: i % 2 ? sky : skySoft,
            metalness: 0.45,
            roughness: 0.35,
          })
        );
        const a = (i / 7) * Math.PI * 2;
        c.userData = { a, r: 1.75 + (i % 3) * 0.12, y: (i % 3) * 0.25 - 0.25 };
        orbit.add(c);
        cubes.push(c);
      }

      const drag = attachDragRotate(canvas, root);
      const clock = new THREE.Clock();
      return {
        onResize: () => sizeTo(renderer, camera, canvas),
        tick: () => {
          const dt = clock.getDelta();
          const t = clock.elapsedTime;
          drag.update(dt);
          shield.rotation.z = Math.sin(t * 0.7) * 0.06;
          cubes.forEach((c) => {
            const u = c.userData;
            const ang = u.a + t * 1.1;
            c.position.set(Math.cos(ang) * u.r, u.y + Math.sin(t * 2 + u.a) * 0.12, Math.sin(ang) * u.r);
            c.rotation.x += 0.02;
            c.rotation.y += 0.025;
          });
          renderer.render(scene, camera);
        },
      };
    });
  }

  /* ---------- GRAPHICS: layered artboard + palette ---------- */
  function initGraphics() {
    bindVisibleLoop(document.getElementById("graphics-canvas"), () => {
      const canvas = document.getElementById("graphics-canvas");
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
      camera.position.set(0, 0.6, 6.2);
      const renderer = makeRenderer(canvas);
      const root = new THREE.Group();
      scene.add(root);
      addMiniLights(scene);

      const layers = [];
      const layerColors = [0x0ea5e9, 0x38bdf8, 0x7dd3fc, 0xffffff];
      for (let i = 0; i < 4; i++) {
        const plane = new THREE.Mesh(
          new THREE.BoxGeometry(2.4 - i * 0.15, 1.7 - i * 0.1, 0.08),
          new THREE.MeshStandardMaterial({
            color: layerColors[i],
            metalness: 0.25,
            roughness: 0.4,
            transparent: true,
            opacity: 0.92,
          })
        );
        plane.position.set(i * 0.12 - 0.2, i * 0.12, -i * 0.18);
        plane.rotation.y = -0.35;
        plane.rotation.x = 0.15;
        root.add(plane);
        layers.push(plane);
      }

      const palette = [0xf472b6, 0xfb923c, 0x38bdf8, 0xa78bfa, 0x34d399];
      const dots = [];
      palette.forEach((c, i) => {
        const d = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 24, 24),
          new THREE.MeshStandardMaterial({ color: c, metalness: 0.3, roughness: 0.25, emissive: c, emissiveIntensity: 0.15 })
        );
        d.position.set(-1.6 + i * 0.35, -1.35, 0.6);
        root.add(d);
        dots.push(d);
      });

      const pen = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.6, 12),
        new THREE.MeshStandardMaterial({ color: ice, metalness: 0.7, roughness: 0.2 })
      );
      pen.rotation.z = Math.PI / 3.2;
      pen.position.set(1.5, -0.7, 0.9);
      root.add(pen);
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.22, 12),
        new THREE.MeshStandardMaterial({ color: deep, metalness: 0.5, roughness: 0.3 })
      );
      tip.position.set(2.05, -1.05, 0.9);
      tip.rotation.z = Math.PI / 3.2 + Math.PI;
      root.add(tip);

      const drag = attachDragRotate(canvas, root);
      const clock = new THREE.Clock();
      return {
        onResize: () => sizeTo(renderer, camera, canvas),
        tick: () => {
          const dt = clock.getDelta();
          const t = clock.elapsedTime;
          drag.update(dt);
          layers.forEach((l, i) => {
            l.position.y = i * 0.12 + Math.sin(t * 1.2 + i) * 0.06;
          });
          dots.forEach((d, i) => {
            d.position.y = -1.35 + Math.sin(t * 2 + i) * 0.08;
          });
          pen.rotation.z = Math.PI / 3.2 + Math.sin(t) * 0.08;
          renderer.render(scene, camera);
        },
      };
    });
  }

  /* ---------- VIDEO: film reel + play button ---------- */
  function initVideo() {
    bindVisibleLoop(document.getElementById("video-canvas"), () => {
      const canvas = document.getElementById("video-canvas");
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
      camera.position.set(0, 0.3, 6.4);
      const renderer = makeRenderer(canvas);
      const root = new THREE.Group();
      scene.add(root);

      scene.add(new THREE.AmbientLight(0xbde0fe, 0.65));
      const light = new THREE.DirectionalLight(0xffffff, 1.05);
      light.position.set(-3, 4, 5);
      scene.add(light);
      const vFill = new THREE.PointLight(sky, 1.3, 14);
      vFill.position.set(2, 1, 2);
      scene.add(vFill);

      const reelGroup = new THREE.Group();
      root.add(reelGroup);

      const reelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.3 });
      const reel = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.28, 48), reelMat);
      reel.rotation.x = Math.PI / 2;
      reelGroup.add(reel);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.34, 24),
        new THREE.MeshStandardMaterial({ color: sky, metalness: 0.5, roughness: 0.25, emissive: deep, emissiveIntensity: 0.25 })
      );
      hub.rotation.x = Math.PI / 2;
      reelGroup.add(hub);

      for (let i = 0; i < 6; i++) {
        const spoke = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 1.7, 0.06),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.4 })
        );
        spoke.rotation.z = (i / 6) * Math.PI;
        spoke.position.z = 0.02;
        reelGroup.add(spoke);
      }

      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.55, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.3, roughness: 0.45 })
      );
      strip.position.set(0, -1.55, 0.4);
      root.add(strip);
      for (let i = 0; i < 5; i++) {
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.32, 0.04),
          new THREE.MeshStandardMaterial({ color: i % 2 ? skySoft : ice, metalness: 0.2, roughness: 0.5 })
        );
        frame.position.set(-0.95 + i * 0.48, -1.55, 0.48);
        root.add(frame);
      }

      const playRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.06, 12, 40),
        new THREE.MeshStandardMaterial({ color: sky, emissive: deep, emissiveIntensity: 0.4, metalness: 0.4, roughness: 0.3 })
      );
      playRing.position.set(1.9, 0.9, 0.8);
      root.add(playRing);

      const play = new THREE.Mesh(
        new THREE.ConeGeometry(0.28, 0.42, 3),
        new THREE.MeshStandardMaterial({ color: ice, metalness: 0.3, roughness: 0.35 })
      );
      play.rotation.z = -Math.PI / 2;
      play.position.set(1.95, 0.9, 0.8);
      root.add(play);

      const timeline = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.1, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x1e40af, metalness: 0.4, roughness: 0.4 })
      );
      timeline.position.set(0, 1.7, 0);
      root.add(timeline);
      const scrubber = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshStandardMaterial({ color: skySoft, emissive: sky, emissiveIntensity: 0.5 })
      );
      scrubber.position.set(-1.2, 1.7, 0.1);
      root.add(scrubber);

      const drag = attachDragRotate(canvas, root);
      const clock = new THREE.Clock();
      return {
        onResize: () => sizeTo(renderer, camera, canvas),
        tick: () => {
          const dt = clock.getDelta();
          const t = clock.elapsedTime;
          drag.update(dt);
          reelGroup.rotation.z = t * 1.2;
          scrubber.position.x = -1.2 + ((Math.sin(t * 0.8) + 1) / 2) * 2.4;
          playRing.scale.setScalar(1 + Math.sin(t * 2.2) * 0.04);
          renderer.render(scene, camera);
        },
      };
    });
  }

  /* ---------- WORK: floating torus knot accent ---------- */
  function initWork() {
    const canvas = document.getElementById("work-canvas");
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
    camera.position.set(0, 0.2, 4.2);
    const renderer = makeRenderer(canvas);
    const root = new THREE.Group();
    scene.add(root);

    scene.add(new THREE.AmbientLight(0xbde0fe, 0.7));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 3, 4);
    scene.add(light);
    const p = new THREE.PointLight(sky, 1.2, 10);
    p.position.set(-2, 1, 2);
    scene.add(p);

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.7, 0.22, 120, 16),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.65,
        roughness: 0.25,
        emissive: deep,
        emissiveIntensity: 0.2,
      })
    );
    root.add(knot);

    for (let i = 0; i < 8; i++) {
      const s = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.1 + Math.random() * 0.08, 0),
        new THREE.MeshStandardMaterial({ color: i % 2 ? skySoft : ice, metalness: 0.4, roughness: 0.35 })
      );
      const a = (i / 8) * Math.PI * 2;
      s.position.set(Math.cos(a) * 1.5, Math.sin(a * 1.3) * 0.6, Math.sin(a) * 1.2);
      s.userData = { a, r: 1.4 + (i % 3) * 0.15 };
      root.add(s);
    }

    function onResize() {
      sizeTo(renderer, camera, canvas);
    }
    onResize();
    addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    function tick() {
      const t = clock.getElapsedTime();
      knot.rotation.x = t * 0.35;
      knot.rotation.y = t * 0.55;
      root.children.forEach((c) => {
        if (c.userData.a == null) return;
        c.position.x = Math.cos(t * 0.6 + c.userData.a) * c.userData.r;
        c.position.z = Math.sin(t * 0.6 + c.userData.a) * c.userData.r;
        c.rotation.y += 0.02;
      });
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    tick();
  }

  function boot() {
    initHero();
    if (reduceMotion) return;
    initWeb();
    initSqa();
    initGraphics();
    initVideo();
    initWork();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
