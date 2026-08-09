import "./saveOverlay.css";

import { encodeToDataURL, makeSaveUrl } from "./qr.js";
import { formatSaveCode } from "./code.js";

let overlay = null;

function buildOverlay() {
  if (overlay) {
    return overlay;
  }

  overlay = document.createElement("div");
  overlay.id = "save-export-overlay";
  overlay.className = "save-export";

  overlay.innerHTML = `
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

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      hideOverlay();
    }
  });

  overlay.querySelector(".save-export-close").addEventListener("click", hideOverlay);

  document.body.appendChild(overlay);
  return overlay;
}

export function showSaveExport({ id }) {
  const el = buildOverlay();

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

  return () => hideOverlay();
}

export function hideOverlay() {
  if (!overlay) {
    return;
  }
  overlay.classList.remove("open");
}