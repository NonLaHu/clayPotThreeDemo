import * as THREE from "/3d/three.module.js";
import { GLTFExporter } from "/3d/GLTFExporter.js";

const INITIAL_HEIGHT = 2;
const SEGMENTS = 64;
const THICKNESS = 0.05;
const CYLINDER_RADIUS = 0.7;

const dataEl = document.getElementById("save-data");
const save = JSON.parse(dataEl.textContent);
const canvas = document.getElementById("viewer-canvas");
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

const potGroup = new THREE.Group();
scene.add(potGroup);

// Lights.
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));
const dir = new THREE.DirectionalLight(0xffffff, 2);
dir.position.set(4, 6, 4);
scene.add(dir);

// Floor shadow catcher is skipped; no ground disc so the pot floats in space.

function buildGeometry(positions) {
  const points = [];
  for (let i = 0; i <= 40; i++) {
    const y = (i / 40) * INITIAL_HEIGHT;
    points.push(new THREE.Vector2(CYLINDER_RADIUS, y));
  }
  for (let i = 40; i >= 0; i--) {
    const y = (i / 40) * INITIAL_HEIGHT;
    points.push(new THREE.Vector2(CYLINDER_RADIUS - THICKNESS, y));
  }
  points.push(new THREE.Vector2(0, 0.08));

  const geo = new THREE.LatheGeometry(points, SEGMENTS);
  if (Array.isArray(positions) && positions.length === geo.attributes.position.count * 3) {
    const attr = geo.attributes.position;
    for (let i = 0; i < attr.count * 3; i++) attr.array[i] = positions[i];
    attr.needsUpdate = true;
  }
  geo.computeVertexNormals();
  return geo;
}

let potMesh = null;

// Real-world scale: 1 scene unit = 10 cm.
const CM_PER_UNIT = 10;
const IN_PER_CM = 1 / 2.54;
function fmtCm(u) { return (u * CM_PER_UNIT).toFixed(1); }
function fmtIn(u) { return (u * CM_PER_UNIT * IN_PER_CM).toFixed(1); }
function fmt(u) { return `${fmtCm(u)}cm · ${fmtIn(u)}in`; }

// Same detection logic as the booth app: height = Y range, diameters = 2 x max
// radius in the matching vertical band.
function measure(positions) {
  const N = positions ? Math.floor(positions.length / 3) : 0;
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < N; i++) {
    const y = positions[i * 3 + 1];
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (!isFinite(minY)) return { height: 0, maxDiameter: 0, baseDiameter: 0, rimDiameter: 0 };
  const height = maxY - minY;
  const band = height * 0.09;
  let maxR = 0, baseR = 0, rimR = 0;
  for (let i = 0; i < N; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    const r = Math.hypot(x, z);
    if (r > maxR) maxR = r;
    if (y <= minY + band && r > baseR) baseR = r;
    if (y >= maxY - band && r > rimR) rimR = r;
  }
  return { height, maxDiameter: maxR * 2, baseDiameter: baseR * 2, rimDiameter: rimR * 2 };
}

function renderMeasurements(positions) {
  const m = measure(positions);

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  set("dim-height", fmt(m.height));
  set("dim-width", fmt(m.maxDiameter));
  set("dim-base", fmt(m.baseDiameter));
  set("dim-rim", fmt(m.rimDiameter));
}

async function loadPot() {
  const geometry = buildGeometry(save && save.positions ? save.positions : null);

  // Show real-world measurements from the saved vertex positions.
  renderMeasurements(save && save.positions ? save.positions : null);

  // Per-vertex colors (the painted rings / clay base) — kept as real vertex
  // colors so the smooth on-screen gradient is preserved, no baking.
  const colors = save && save.colors ? save.colors : null;
  if (Array.isArray(colors) && colors.length === geometry.attributes.position.count * 3) {
    geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3));
  }

  // Pattern layer (white base + stamps), same texture the live pot uses.
  const patternDataUrl =
    save && save.patterns && typeof save.patterns.canvasData === "string"
      ? save.patterns.canvasData
      : null;
  const patternTexture = patternDataUrl
    ? await loadImageTexture(patternDataUrl)
    : null;

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: patternTexture,
    vertexColors: true,
    roughness: 0.92,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  potMesh = new THREE.Mesh(geometry, material);
  potGroup.add(potMesh);
}

function loadImageTexture(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const texture = new THREE.Texture(img);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      resolve(texture);
    };
    img.onerror = () => reject(new Error("pattern load failed"));
    img.src = src;
  });
}

// Initial orbit state.
let yaw = 0.45;
const pitchMin = 0.1, pitchMax = Math.PI / 2 - 0.05;
let pitch = 0.35;
let radius = 5;
const radiusMin = 3, radiusMax = 9;

function updateCamera() {
  camera.position.set(
    Math.sin(yaw) * Math.cos(pitch) * radius,
    1 + Math.sin(pitch) * radius,
    Math.cos(yaw) * Math.cos(pitch) * radius,
  );
  camera.lookAt(0, 1, 0);
}

let dragging = false;
let px = 0, py = 0;

function pointerDown(e) {
  dragging = true;
  px = e.clientX;
  py = e.clientY;
}
function pointerMove(e) {
  if (!dragging) return;
  const dx = e.clientX - px;
  const dy = e.clientY - py;
  px = e.clientX;
  py = e.clientY;
  yaw -= dx * 0.005;
  pitch = Math.max(pitchMin, Math.min(pitchMax, pitch + dy * 0.005));
}
function pointerUp() {
  dragging = false;
}
function wheel(e) {
  e.preventDefault();
  radius = Math.max(radiusMin, Math.min(radiusMax, radius + e.deltaY * 0.001));
}

canvas.addEventListener("pointerdown", pointerDown);
window.addEventListener("pointermove", pointerMove);
window.addEventListener("pointerup", pointerUp);
canvas.addEventListener("wheel", wheel, { passive: false });

function resize() {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width, h = rect.height;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

function animate() {
  resize();
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

async function downloadGLB() {
  if (!potMesh) return;
  const exporter = new GLTFExporter();
  const buffer = await exporter.parseAsync(potMesh, { binary: true });
  const blob = new Blob([buffer], { type: "model/gltf-binary" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clay-pot-${save.id}.glb`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

window.addEventListener("load", () => {
  document.getElementById("dl-glb").addEventListener("click", () => {
    downloadGLB().catch((err) => console.error(err));
  });
  loadPot()
    .then(() => animate())
    .catch((err) => console.error("viewer failed:", err));
});
