/* 3D banana for the contact finale — procedural geometry, no model file needed. */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.querySelector("[data-banana]");
if (canvas && window.WebGLRenderingContext) {
  try {
    init(canvas);
  } catch (err) {
    canvas.remove();
  }
}

function init(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20);
  camera.position.set(0, 0, 3.4);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xfff3dd, 1.6);
  key.position.set(2, 3, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8888ff, 0.5);
  rim.position.set(-3, -1, -2);
  scene.add(rim);

  const banana = buildBanana();
  banana.rotation.z = 1.25; // stand it upright like the reference
  scene.add(banana);

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  renderer.setAnimationLoop(() => {
    if (!reduceMotion) {
      banana.rotation.y += 0.006;
      banana.rotation.x = Math.sin(performance.now() * 0.0004) * 0.12;
    }
    renderer.render(scene, camera);
  });
}

/* Banana = tapered tube with a 5-ridge cross-section along a bent curve. */
function buildBanana() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.05, 0.42, 0),
    new THREE.Vector3(-0.62, -0.05, 0),
    new THREE.Vector3(0.0, -0.3, 0),
    new THREE.Vector3(0.62, -0.02, 0),
    new THREE.Vector3(1.05, 0.48, 0),
  ]);

  const SEGS = 120;
  const SIDES = 24;
  const frames = curve.computeFrenetFrames(SEGS, false);

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const radiusAt = (t) => {
    // stems at both ends, belly in the middle
    const belly = Math.pow(Math.sin(Math.PI * THREE.MathUtils.clamp(t, 0, 1)), 0.75);
    return 0.035 + 0.185 * belly;
  };

  for (let i = 0; i <= SEGS; i++) {
    const t = i / SEGS;
    const point = curve.getPointAt(t);
    const N = frames.normals[Math.min(i, SEGS - 1)];
    const B = frames.binormals[Math.min(i, SEGS - 1)];
    const baseR = radiusAt(t);

    for (let j = 0; j <= SIDES; j++) {
      const a = (j / SIDES) * Math.PI * 2;
      // 5 subtle ridges, like a real banana
      const r = baseR * (1 + 0.09 * Math.cos(5 * a));
      const nx = Math.cos(a) * N.x + Math.sin(a) * B.x;
      const ny = Math.cos(a) * N.y + Math.sin(a) * B.y;
      const nz = Math.cos(a) * N.z + Math.sin(a) * B.z;
      positions.push(point.x + r * nx, point.y + r * ny, point.z + r * nz);
      normals.push(nx, ny, nz);
      uvs.push(t, j / SIDES);
    }
  }

  for (let i = 0; i < SEGS; i++) {
    for (let j = 0; j < SIDES; j++) {
      const a = i * (SIDES + 1) + j;
      const b = a + SIDES + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    map: bananaTexture(),
    roughness: 0.55,
    metalness: 0.0,
  });

  return new THREE.Mesh(geo, mat);
}

/* Speckled ripe-banana skin painted on a canvas. u axis = along the fruit. */
function bananaTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0.0, "#5a3c14");
  grad.addColorStop(0.05, "#8a6420");
  grad.addColorStop(0.18, "#d9ae35");
  grad.addColorStop(0.5, "#e8c243");
  grad.addColorStop(0.82, "#d9ae35");
  grad.addColorStop(0.95, "#8a6420");
  grad.addColorStop(1.0, "#4a3210");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 256);

  // ridge shading stripes along the length
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#7a5a18";
  for (let j = 0; j < 5; j++) {
    ctx.fillRect(0, (j / 5) * 256 - 4, 1024, 9);
  }
  ctx.globalAlpha = 1;

  // ripe speckles
  for (let i = 0; i < 900; i++) {
    const x = 60 + Math.random() * 904;
    const y = Math.random() * 256;
    const r = Math.random() * 3.2 + 0.4;
    ctx.fillStyle = `rgba(${70 + Math.random() * 40}, ${
      45 + Math.random() * 25
    }, 10, ${0.25 + Math.random() * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r * (1 + Math.random()), r, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // a few bigger bruises
  for (let i = 0; i < 14; i++) {
    const x = 150 + Math.random() * 720;
    const y = Math.random() * 256;
    const r = 8 + Math.random() * 22;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(90, 55, 12, 0.5)");
    g.addColorStop(1, "rgba(90, 55, 12, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}
