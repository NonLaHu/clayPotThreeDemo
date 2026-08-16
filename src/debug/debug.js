import {
  DEBUG,
  HAND_CONNECTIONS,
} from "../core/constants.js";

let video = null;
let canvas = null;
let ctx = null;

export function initDebug() {
  if (!DEBUG) {
    return;
  }

  // -----------------------------
  // Camera debug video
  // -----------------------------

  video = document.createElement("video");

  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;

  video.style.position = "fixed";
  video.style.bottom = "10px";
  video.style.right = "10px";
  video.style.width = "320px";
  video.style.zIndex = "9999";
  video.style.transform = "scaleX(-1)";

  document.body.appendChild(video);

  // -----------------------------
  // Hand debug canvas
  // -----------------------------

  canvas = document.createElement("canvas");

  canvas.width = 320;
  canvas.height = 240;

  canvas.style.position = "fixed";
  canvas.style.bottom = "10px";
  canvas.style.right = "10px";
  canvas.style.zIndex = "10000";
  canvas.style.pointerEvents = "none";

  document.body.appendChild(canvas);

  ctx = canvas.getContext("2d");
}

export function getDebugVideo() {
  return video;
}

export function drawHand(hand) {
  if (!DEBUG || !ctx || !canvas) {
    return;
  }

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height,
  );

  // -----------------------------
  // Landmarks
  // -----------------------------

  ctx.fillStyle = "red";

  for (const point of hand) {
    const x =
      (1 - point.x) *
      canvas.width;

    const y =
      point.y *
      canvas.height;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      4,
      0,
      Math.PI * 2,
    );

    ctx.fill();
  }

  // -----------------------------
  // Connections
  // -----------------------------

  ctx.strokeStyle = "cyan";
  ctx.lineWidth = 2;

  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.beginPath();

    ctx.moveTo(
      (1 - hand[a].x) *
        canvas.width,
      hand[a].y *
        canvas.height,
    );

    ctx.lineTo(
      (1 - hand[b].x) *
        canvas.width,
      hand[b].y *
        canvas.height,
    );

    ctx.stroke();
  }
}