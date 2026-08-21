import { renderSceneFrame } from "./poster.js";

const POSTER_W = 1080;
const POSTER_H = 1350;

const FRAME = {
  top: 150,
  right: 90,
  bottom: 250,
  left: 90,
};

const RENDER_W = POSTER_W - FRAME.left - FRAME.right;
const RENDER_H = POSTER_H - FRAME.top - FRAME.bottom;

/**
 * Render the pot scene into a print-friendly poster and open the browser's
 * native print dialog. The poster includes a decorative border, header,
 * the pot render, and the current date.
 */
export async function printPoster({ renderer, scene, camera, creatorName }) {
  const renderCanvas = await renderSceneFrame(renderer, scene, camera);
  const posterDataUrl = composePrintPoster(renderCanvas, creatorName);
  openPrintDialog(posterDataUrl);
}

function composePrintPoster(renderCanvas, creatorName) {
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d");

  drawBackground(ctx);
  drawBorder(ctx);
  drawRender(ctx, renderCanvas);
  drawHeader(ctx);
  drawDate(ctx);
  drawCreatorName(ctx, creatorName);

  return canvas.toDataURL("image/png");
}

function drawBackground(ctx) {
  const bg = ctx.createLinearGradient(0, 0, 0, POSTER_H);
  bg.addColorStop(0, "#f7efe2");
  bg.addColorStop(1, "#ead9bf");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
}

function drawBorder(ctx) {
  ctx.strokeStyle = "#8b5a2b";
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, POSTER_W - 40, POSTER_H - 40);
}

function drawRender(ctx, renderCanvas) {
  ctx.drawImage(renderCanvas, FRAME.left, FRAME.top - 16, RENDER_W, RENDER_H + 32);
}

function drawHeader(ctx) {
  ctx.textAlign = "center";
  ctx.fillStyle = "#5b3a1d";
  ctx.font = "700 34px Georgia, serif";
  ctx.fillText("Handmade Clay Pot", POSTER_W / 2, FRAME.top - 56);
}

function drawDate(ctx) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#8a6a4a";
  ctx.font = "400 18px Georgia, serif";
  ctx.fillText(dateStr, POSTER_W / 2, POSTER_H - FRAME.bottom + 80);
}

function drawCreatorName(ctx, name) {
  if (!name) return;

  ctx.textAlign = "center";
  ctx.fillStyle = "#8a6a4a";
  ctx.font = "400 18px Georgia, serif";
  ctx.fillText(`Created by: ${name}`, POSTER_W / 2, POSTER_H - FRAME.bottom + 112);
}

function openPrintDialog(posterDataUrl) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.visibility = "hidden";

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Print Clay Pot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #fff;
    }
    img {
      max-width: 100%;
      max-height: 100vh;
      height: auto;
    }
    @media print {
      body { margin: 0; padding: 0; background: #fff; }
      img { max-width: 100%; height: auto; }
    }
  </style>
</head>
<body>
  <img src="${posterDataUrl}" />
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;

  document.body.appendChild(iframe);

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 1000);
  };

  iframe.contentWindow.addEventListener("afterprint", cleanup);

  iframe.srcdoc = html;
}
