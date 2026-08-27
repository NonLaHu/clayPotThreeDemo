import { renderSceneFrame, ensureLeagueGothic } from "./poster.js";

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

/**
 * Render the pot scene into a print-friendly poster and open the browser's
 * native print dialog. The poster includes the border template, header,
 * the pot render, creator name, and the current date.
 */
export async function printPoster({ renderer, scene, camera, creatorName }) {
  const renderCanvas = await renderSceneFrame(renderer, scene, camera);
  const posterDataUrl = await composePrintPoster(renderCanvas, creatorName);
  openPrintDialog(posterDataUrl);
}

async function composePrintPoster(renderCanvas, creatorName) {
  const template = await loadTemplate();

  const canvas = document.createElement("canvas");
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d");

  // Draw border template.
  ctx.drawImage(template, 0, 0, POSTER_W, POSTER_H);

  // Pot render into the cutout area (left photo box).
  ctx.drawImage(renderCanvas, FRAME.left, FRAME.top, RENDER_W, RENDER_H);

  // Creator name beside the "To:" label at the top-left of the card,
  // matching the template's label styling (League Gothic, #282c87).
  // Baseline and size align with the rendered "To:" glyphs (~40px tall).
  if (creatorName) {
    await ensureLeagueGothic();

    ctx.textAlign = "left";
    ctx.fillStyle = "#282c87";
    ctx.font = "400 60px 'League Gothic', sans-serif";
    ctx.fillText(creatorName, 175, 90);
  }

  return canvas.toDataURL("image/png");
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
