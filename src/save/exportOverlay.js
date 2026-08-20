import "./saveOverlay.css";

import { encodeToDataURL, makeSaveUrl } from "./qr.js";
import { formatSaveCode } from "./code.js";

let choiceOverlay = null;
let qrOverlay = null;

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

export function showExportChoice({ onQR, onPrint }) {
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

  return () => hideChoiceOverlay();
}

function hideChoiceOverlay() {
  if (!choiceOverlay) return;
  choiceOverlay.classList.remove("open");
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
}
