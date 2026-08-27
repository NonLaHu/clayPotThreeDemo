import * as THREE from "three";

import { formatSaveCode } from "./code.js";

// Poster dimensions, matching the landscape border template (template.png).
const POSTER_W = 1748;
const POSTER_H = 1240;

// Where the 3D render sits on the template: the pot photo box on the left.
// The pot fills this cutout (left x=60, right x=741, top y=170, bottom y=1230).
const FRAME = {
  top: 170,
  right: 1007,
  bottom: 10,
  left: 60,
};

const RENDER_W = POSTER_W - FRAME.left - FRAME.right;
const RENDER_H = POSTER_H - FRAME.top - FRAME.bottom;

// Template image, loaded once and cached.
let _templateImg = null;

function loadTemplate() {
  if (_templateImg) return Promise.resolve(_templateImg);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { _templateImg = img; resolve(img); };
    img.onerror = () => reject(new Error("Failed to load border template"));
    img.src = "/template.png";
  });
}

// Best-effort webfont readiness: never blocks or rejects the export flow.
// If League Gothic isn't ready in time (e.g. Google Fonts unavailable over
// QUIC), we simply fall back to whatever font is available.
export async function ensureLeagueGothic() {
  try {
    await Promise.race([
      document.fonts.load("400 60px 'League Gothic'"),
      new Promise((r) => setTimeout(r, 800)),
    ]);
    await Promise.race([
      document.fonts.ready,
      new Promise((r) => setTimeout(r, 200)),
    ]);
  } catch {
    // ignore — fall back
  }
}

/**
 * Snapshot of the live scene (pot on the table) at the current camera angle,
 * wrapped in a bordered poster with the save code.
 * Returns a PNG data URL.
 */
export async function renderPoster(opts) {
  const { renderer, scene, camera, id, boothLabel } = opts;

  const renderCanvas = await renderSceneFrame(renderer, scene, camera);

  return composePoster(renderCanvas, id, boothLabel);
}

// ------------------------------------------------------------
// Snapshot the actual scene without creating a second WebGL context. We
// reuse the booth's renderer and draw into an offscreen render target sized
// like the poster photo slot, then read the pixels back into a 2D canvas.
// ------------------------------------------------------------
export async function renderSceneFrame(renderer, scene, camera) {
  const previousBackground = scene.background;
  scene.background = null;

  const hidden = [];
  scene.traverse((obj) => {
    if (obj.visible && obj.userData && obj.userData.hideInPoster) {
      hidden.push(obj);
      obj.visible = false;
    }
  });

  try {
    return await renderSceneFramePixels(renderer, scene, camera);
  } finally {
    for (const obj of hidden) {
      obj.visible = true;
    }
    scene.background = previousBackground;
  }
}

async function renderSceneFramePixels(renderer, scene, camera) {
  const posterCamera = makePosterCamera();

  const target = new THREE.WebGLRenderTarget(RENDER_W, RENDER_H, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
  });

  // Match the on-screen renderer's output encoding so the read-back pixels
  // look identical to what the user sees on the booth display.
  if (renderer.outputColorSpace === THREE.SRGBColorSpace) {
    target.texture.colorSpace = THREE.SRGBColorSpace;
  }

  const previous = renderer.getRenderTarget();

  renderer.setRenderTarget(target);
  renderer.render(scene, posterCamera);
  renderer.setRenderTarget(previous);

  let pixels = readRenderTargetPixels(renderer, target);

  // Read-back guard: give the compositor an extra frame before giving up.
  if (pixels === null || isBlankPixels(pixels)) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    renderer.setRenderTarget(target);
    renderer.render(scene, posterCamera);
    renderer.setRenderTarget(previous);
    pixels = readRenderTargetPixels(renderer, target);
  }

  target.dispose();

  if (!pixels) {
    throw new Error("poster frame read-back failed");
  }

  const canvas = document.createElement("canvas");
  canvas.width = RENDER_W;
  canvas.height = RENDER_H;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(RENDER_W, RENDER_H);
  imageData.data.set(flipPixelsVertically(pixels, RENDER_W, RENDER_H));
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

// readRenderTargetPixels returns rows bottom-to-top (WebGL origin), but
// putImageData draws top-to-bottom — so swap rows for an upright image.
function flipPixelsVertically(pixels, width, height) {
  const rowBytes = width * 4;
  const flipped = new Uint8Array(pixels.length);

  for (let row = 0; row < height; row++) {
    const srcStart = (height - 1 - row) * rowBytes;
    const dstStart = row * rowBytes;
    flipped.set(pixels.subarray(srcStart, srcStart + rowBytes), dstStart);
  }

  return flipped;
}

function makePosterCamera() {
  const posterCamera = new THREE.PerspectiveCamera(
    45,
    RENDER_W / RENDER_H,
    0.1,
    100,
  );

  // Fixed angle so every pot cutout is captured from the same vantage
  // point, regardless of how the user rotated the live camera. These match
  // the app's default camera state (src/core/state.js).
  const radius = 5;
  const horizontal = 0.45;
  const vertical = 0.18;

  posterCamera.position.set(
    Math.sin(horizontal) * Math.cos(vertical) * radius,
    1 + Math.sin(vertical) * radius,
    Math.cos(horizontal) * Math.cos(vertical) * radius,
  );
  posterCamera.lookAt(0, 1, 0);
  posterCamera.updateProjectionMatrix();

  return posterCamera;
}

function readRenderTargetPixels(renderer, target) {
  const { width, height } = target;
  const pixels = new Uint8Array(width * height * 4);

  try {
    renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
  } catch {
    return null;
  }

  return pixels;
}

function isBlankPixels(pixels) {
  let alphaSum = 0;
  for (let i = 3; i < pixels.length; i += 40) {
    alphaSum += pixels[i];
  }
  return alphaSum === 0;
}

// ------------------------------------------------------------
// Composite the bordered poster: template background, render, QR.
// ------------------------------------------------------------
async function composePoster(renderCanvas, id, boothLabel) {
  const template = await loadTemplate();

  const canvas = document.createElement("canvas");
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d");

  // Draw border template.
  ctx.drawImage(template, 0, 0, POSTER_W, POSTER_H);

  // Pot render into the cutout area (left photo box).
  ctx.drawImage(renderCanvas, FRAME.left, FRAME.top, RENDER_W, RENDER_H);

  // Save code, right-aligned below the "Project name" in the right panel
  // (project name sits at top-right, baseline ~y90; code goes right below).
  const code = formatSaveCode(id);

  const codeRight = 1685;

  await ensureLeagueGothic();

  ctx.textAlign = "right";
  ctx.fillStyle = "#282c87";
  ctx.font = "400 30px 'League Gothic', sans-serif";
  ctx.fillText("SAVE CODE", codeRight, 130);

  ctx.font = "400 54px 'League Gothic', sans-serif";
  ctx.fillText(code, codeRight, 185);

  return canvas.toDataURL("image/png");
}