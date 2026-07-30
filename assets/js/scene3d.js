"use strict";

(function () {
  if (typeof THREE === "undefined") return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
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

  /* ---------- HERO: floating sky cubes + orb ---------- */
  function initHero() {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.4, 8.5);

    const renderer = makeRenderer(canvas);
    const group = new THREE.Group();
    scene.add(group);

    scene.add(new THREE.AmbientLight(0x8ecae6, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 6, 3);
    scene.add(key);
    const fill = new THREE.PointLight(sky, 1.4, 20);
    fill.position.set(-3, 2, 2);
    scene.add(fill);
    const warm = new THREE.PointLight(0xffb86b, 0.9, 16);
    warm.position.set(3.5, 3.2, 1);
    scene.add(warm);

    const mats = [
      new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.35, roughness: 0.45 }),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.5, roughness: 0.35 }),
      new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.4, roughness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.55, roughness: 0.3 }),
    ];

    const cubes = [];
    for (let i = 0; i < 14; i++) {
      const size = 0.45 + Math.random() * 0.85;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mats[i % mats.length]);
      mesh.position.set(
        (Math.random() - 0.5) * 7.5,
        (Math.random() - 0.5) * 4.2,
        (Math.random() - 0.5) * 4
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      mesh.userData = {
        spin: 0.002 + Math.random() * 0.01,
        bob: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        baseY: mesh.position.y,
      };
      group.add(mesh);
      cubes.push(mesh);
    }

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffc14d,
        emissive: 0xff9f1c,
        emissiveIntensity: 1.4,
        metalness: 0.2,
        roughness: 0.25,
      })
    );
    orb.position.set(2.4, 2.1, 0.5);
    group.add(orb);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.04, 12, 48),
      new THREE.MeshStandardMaterial({ color: skySoft, metalness: 0.7, roughness: 0.2, emissive: deep, emissiveIntensity: 0.3 })
    );
    ring.rotation.x = Math.PI / 2.4;
    ring.position.set(-2.2, -0.4, 1);
    group.add(ring);

    let mx = 0;
    let my = 0;
    addEventListener("pointermove", (e) => {
      mx = (e.clientX / innerWidth - 0.5) * 0.6;
      my = (e.clientY / innerHeight - 0.5) * 0.35;
    });

    function onResize() {
      sizeTo(renderer, camera, canvas);
    }
    onResize();
    addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    function tick() {
      const t = clock.getElapsedTime();
      cubes.forEach((c) => {
        c.rotation.x += c.userData.spin;
        c.rotation.y += c.userData.spin * 0.8;
        c.position.y = c.userData.baseY + Math.sin(t * c.userData.bob + c.userData.phase) * 0.25;
      });
      orb.position.y = 2.1 + Math.sin(t * 1.4) * 0.25;
      ring.rotation.z = t * 0.6;
      group.rotation.y = mx * 0.35;
      group.rotation.x = my * 0.2;
      camera.position.x += (mx * 0.8 - camera.position.x) * 0.04;
      camera.position.y += (0.4 - my * 0.5 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ---------- GRAPHICS: layered artboard + palette ---------- */
  function initGraphics() {
    const canvas = document.getElementById("graphics-canvas");
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0.6, 6.2);
    const renderer = makeRenderer(canvas);
    const root = new THREE.Group();
    scene.add(root);

    scene.add(new THREE.AmbientLight(0xbde0fe, 0.7));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(3, 5, 4);
    scene.add(light);
    const gFill = new THREE.PointLight(sky, 1.2, 12);
    gFill.position.set(-2, 2, 2);
    scene.add(gFill);

    // layered design frames
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

    // color palette spheres
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

    // pen / stylus
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

    function onResize() {
      sizeTo(renderer, camera, canvas);
    }
    onResize();
    addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    function tick() {
      const t = clock.getElapsedTime();
      root.rotation.y = Math.sin(t * 0.45) * 0.35;
      layers.forEach((l, i) => {
        l.position.y = i * 0.12 + Math.sin(t * 1.2 + i) * 0.06;
      });
      dots.forEach((d, i) => {
        d.position.y = -1.35 + Math.sin(t * 2 + i) * 0.08;
      });
      pen.rotation.z = Math.PI / 3.2 + Math.sin(t) * 0.08;
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ---------- VIDEO: film reel + play button ---------- */
  function initVideo() {
    const canvas = document.getElementById("video-canvas");
    if (!canvas) return;

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

    // film reel body
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

    // spokes
    for (let i = 0; i < 6; i++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.7, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.4 })
      );
      spoke.rotation.z = (i / 6) * Math.PI;
      spoke.position.z = 0.02;
      reelGroup.add(spoke);
    }

    // film strip
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

    // play button
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

    // timeline bar
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

    function onResize() {
      sizeTo(renderer, camera, canvas);
    }
    onResize();
    addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    function tick() {
      const t = clock.getElapsedTime();
      root.rotation.y = Math.sin(t * 0.35) * 0.4;
      reelGroup.rotation.z = t * 1.2;
      scrubber.position.x = -1.2 + ((Math.sin(t * 0.8) + 1) / 2) * 2.4;
      playRing.scale.setScalar(1 + Math.sin(t * 2.2) * 0.04);
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    tick();
  }

  function boot() {
    initHero();
    initGraphics();
    initVideo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
