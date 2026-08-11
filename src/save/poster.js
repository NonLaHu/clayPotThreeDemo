import * as THREE from "three";

import { formatSaveCode } from "./code.js";

// Poster dimensions (portrait). Poster frame adds padding around the render.
const POSTER_W = 1080;
const POSTER_H = 1350;

// Where the 3D render sits inside the poster.
const FRAME = {
  top: 150,
  right: 90,
  bottom: 250,
  left: 90,
};

const RENDER_W = POSTER_W - FRAME.left - FRAME.right;
const RENDER_H = POSTER_H - FRAME.top - FRAME.bottom;

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
async function renderSceneFrame(renderer, scene, camera) {
  // Gesture indicator overlays (finger pointer, paint highlight) are marked
  // with userData.hideInPoster so they never appear in the saved photo, even
  // though they are visible on the live booth display.
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
  }
}

async function renderSceneFramePixels(renderer, scene, camera) {
  const posterCamera = makePosterCamera(camera);

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

function makePosterCamera(sourceCamera) {
  const posterCamera = new THREE.PerspectiveCamera(
    45,
    RENDER_W / RENDER_H,
    0.1,
    100,
  );

  posterCamera.position.copy(sourceCamera.position);
  posterCamera.rotation.copy(sourceCamera.rotation);
  posterCamera.updateProjectionMatrix();

  // Re-derive the look-at direction from the (possibly interpolated) main
  // camera so the snapshot always faces the pot the way the user sees it.
  const direction = new THREE.Vector3();
  sourceCamera.getWorldDirection(direction);
  posterCamera.lookAt(
    sourceCamera.position.x + direction.x * 10,
    sourceCamera.position.y + direction.y * 10,
    sourceCamera.position.z + direction.z * 10,
  );
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
// Composite the bordered poster: background, frame, render, QR.
// ------------------------------------------------------------
async function composePoster(renderCanvas, id, boothLabel) {
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d");

  // Tile background.
  const bg = ctx.createLinearGradient(0, 0, 0, POSTER_H);
  bg.addColorStop(0, "#f7efe2");
  bg.addColorStop(1, "#ead9bf");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  // Outer terracotta border.
  ctx.strokeStyle = "#8b5a2b";
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, POSTER_W - 40, POSTER_H - 40);

  // Inner cream frame.
  ctx.strokeStyle = "#fff8dc";
  ctx.lineWidth = 4;
  ctx.strokeRect(
    FRAME.left - 16,
    FRAME.top - 72,
    RENDER_W + 32,
    RENDER_H + 92,
  );

  // Photo.
  ctx.drawImage(renderCanvas, FRAME.left, FRAME.top - 16, RENDER_W, RENDER_H + 32);

  // Header title.
  ctx.textAlign = "center";
  ctx.fillStyle = "#5b3a1d";
  ctx.font = "700 34px Georgia, serif";
  ctx.fillText("Handmade Clay Pot", POSTER_W / 2, FRAME.top - 56);

  // Subtitle.
  ctx.fillStyle = "#8a6a4a";
  ctx.font = "400 20px Georgia, serif";
  ctx.fillText(
    `Booth ${boothLabel || "Exhibition"}`,
    POSTER_W / 2,
    FRAME.top - 28,
  );

  // Footer: save code card.
  const code = formatSaveCode(id);

  const cardX = FRAME.left;
  const cardY = POSTER_H - FRAME.bottom + 34;
  const cardW = POSTER_W - FRAME.left - FRAME.right;
  const cardH = 176;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cardX, cardY, cardW, cardH);

  ctx.strokeStyle = "#e0cbb0";
  ctx.lineWidth = 2;
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  ctx.textAlign = "center";
  ctx.fillStyle = "#8a6a4a";
  ctx.font = "600 15px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText("YOUR SAVE CODE", cardX + cardW / 2, cardY + 38);

  ctx.fillStyle = "#5b3a1d";
  ctx.font = "700 46px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(code, cardX + cardW / 2, cardY + 100);

  ctx.fillStyle = "#8a6a4a";
  ctx.font = "400 15px Georgia, serif";
  ctx.fillText("Keep this code to continue your pot later.", cardX + cardW / 2, cardY + 132);
  ctx.fillText("Enter it in the 'Load Progress' button on the booth.", cardX + cardW / 2, cardY + 158);

  return canvas.toDataURL("image/png");
}