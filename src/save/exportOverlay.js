import "./saveOverlay.css";

import { encodeToDataURL, makeSaveUrl } from "./qr.js";
import { formatSaveCode } from "./code.js";

let choiceOverlay = null;
let qrOverlay = null;
let viewerOverlay = null;

// ------------------------------------------------------------
// Choice popup: QR Code | Print
// ------------------------------------------------------------

function buildChoiceOverlay() {
  if (choiceOverlay) return choiceOverlay;

  choiceOverlay = document.createElement("div");
  choiceOverlay.id = "export-choice-overlay";
  choiceOverlay.className = "save-export";

  choiceOverlay.innerHTML = `
    <div class="save-export-card">
      <button class="save-export-close" type="button" aria-label="Close">&times;</button>
      <h2 class="save-export-title">Export your work</h2>
      <p class="save-export-hint">
        Choose how you'd like to save your pot.
      </p>
      <div class="export-choice-btns">
        <button class="export-choice-btn" id="export-qr-btn" type="button">
          <i data-feather="smartphone"></i>
          <span>QR Code</span>
        </button>
        <button class="export-choice-btn" id="export-print-btn" type="button">
          <i data-feather="printer"></i>
          <span>Print</span>
        </button>
        <button class="export-choice-btn" id="export-glb-btn" type="button">
          <i data-feather="box"></i>
          <span>3D Model (GLB)</span>
        </button>
      </div>
    </div>
  `;

  choiceOverlay.addEventListener("click", (e) => {
    if (e.target === choiceOverlay) hideChoiceOverlay();
  });

  choiceOverlay.querySelector(".save-export-close")
    .addEventListener("click", hideChoiceOverlay);

  document.body.appendChild(choiceOverlay);
  return choiceOverlay;
}

export function showExportChoice({ onQR, onPrint, onGLB }) {
  const el = buildChoiceOverlay();
  el.classList.add("open");

  if (window.feather) {
    window.feather.replace();
  }

  el.querySelector("#export-qr-btn").onclick = () => {
    hideChoiceOverlay();
    if (typeof onQR === "function") onQR();
  };

  el.querySelector("#export-print-btn").onclick = () => {
    hideChoiceOverlay();
    if (typeof onPrint === "function") onPrint();
  };

  el.querySelector("#export-glb-btn").onclick = () => {
    hideChoiceOverlay();
    if (typeof onGLB === "function") onGLB();
  };

  return () => hideChoiceOverlay();
}

function hideChoiceOverlay() {
  if (!choiceOverlay) return;
  choiceOverlay.classList.remove("open");
}

// ------------------------------------------------------------
// 3D viewer prompt: current pot | load pot
// ------------------------------------------------------------

function buildViewerOverlay() {
  if (viewerOverlay) return viewerOverlay;

  viewerOverlay = document.createElement("div");
  viewerOverlay.id = "viewer-choice-overlay";
  viewerOverlay.className = "save-export";

  viewerOverlay.innerHTML = `
    <div class="save-export-card">
      <button class="save-export-close" type="button" aria-label="Close">&times;</button>
      <h2 class="save-export-title">3D Viewer</h2>
      <p class="save-export-hint">
        Would you like to open the 3D viewer for this pot, or load a different one?
      </p>
      <div class="export-choice-btns">
        <button class="export-choice-btn" id="viewer-current-btn" type="button">
          <i data-feather="box"></i>
          <span>Current pot</span>
        </button>
        <button class="export-choice-btn" id="viewer-load-btn" type="button">
          <i data-feather="upload-cloud"></i>
          <span>Load pot</span>
        </button>
      </div>
    </div>
  `;

  viewerOverlay.addEventListener("click", (e) => {
    if (e.target === viewerOverlay) hideViewerOverlay();
  });

  viewerOverlay.querySelector(".save-export-close")
    .addEventListener("click", hideViewerOverlay);

  document.body.appendChild(viewerOverlay);
  return viewerOverlay;
}

export function showViewerChoice({ onCurrentPot, onLoadPot }) {
  const el = buildViewerOverlay();
  el.classList.add("open");

  if (window.feather) {
    window.feather.replace();
  }

  el.querySelector("#viewer-current-btn").onclick = () => {
    hideViewerOverlay();
    if (typeof onCurrentPot === "function") onCurrentPot();
  };

  el.querySelector("#viewer-load-btn").onclick = () => {
    hideViewerOverlay();
    if (typeof onLoadPot === "function") onLoadPot();
  };

  return () => hideViewerOverlay();
}

function hideViewerOverlay() {
  if (!viewerOverlay) return;
  viewerOverlay.classList.remove("open");
}

// ------------------------------------------------------------
// QR code overlay (existing flow, unchanged)
// ------------------------------------------------------------

function buildQROverlay() {
  if (qrOverlay) return qrOverlay;

  qrOverlay = document.createElement("div");
  qrOverlay.id = "save-export-overlay";
  qrOverlay.className = "save-export";

  qrOverlay.innerHTML = `
    <div class="save-export-card">
      <button class="save-export-close" type="button" aria-label="Close">&times;</button>

      <h2 class="save-export-title">Your work is ready!</h2>

      <p class="save-export-hint">
        Scan this QR with your phone to download the photo of your pot.
      </p>

      <div class="save-export-qr-wrap">
        <img class="save-export-qr" alt="Save QR code" />
      </div>

      <p class="save-export-link">Save code: <span class="save-export-id"></span></p>

      <div class="save-export-spinner">Preparing…</div>

      <a class="save-export-url" target="_blank" rel="noopener"></a>
    </div>
  `;

  qrOverlay.addEventListener("click", (e) => {
    if (e.target === qrOverlay) hideQROverlay();
  });

  qrOverlay.querySelector(".save-export-close")
    .addEventListener("click", hideQROverlay);

  document.body.appendChild(qrOverlay);
  return qrOverlay;
}

export function showSaveExport({ id }) {
  const el = buildQROverlay();

  const img = el.querySelector(".save-export-qr");

  el.classList.add("open");
  el.querySelector(".save-export-spinner").style.display = "block";
  el.querySelector(".save-export-spinner").textContent = "Preparing…";
  img.style.display = "none";

  el.querySelector(".save-export-id").textContent = formatSaveCode(id);

  makeSaveUrl(`/s/${id}`)
    .then((url) => {
      el.querySelector(".save-export-url").href = url;
      el.querySelector(".save-export-url").textContent = url;

      return encodeToDataURL(url);
    })
    .then((dataUrl) => {
      img.src = dataUrl;
      img.style.display = "block";
      el.querySelector(".save-export-spinner").style.display = "none";
    })
    .catch(() => {
      el.querySelector(".save-export-spinner").textContent =
        "Could not generate QR / save link";
    });

  return () => hideQROverlay();
}

function hideQROverlay() {
  if (!qrOverlay) return;
  qrOverlay.classList.remove("open");
}

export function hideOverlay() {
  hideChoiceOverlay();
  hideQROverlay();
  hideViewerOverlay();
}
