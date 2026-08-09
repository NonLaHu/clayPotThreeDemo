import "./saveOverlay.css";

import { formatSaveCode } from "./code.js";

let confirmEl = null;
let pendingResolve = null;

function build() {
  if (confirmEl) {
    return confirmEl;
  }

  confirmEl = document.createElement("div");
  confirmEl.id = "save-confirm-overlay";
  confirmEl.className = "save-export";

  confirmEl.innerHTML = `
    <div class="save-export-card save-confirm-card">
      <h2 class="save-export-title">Load this pot?</h2>
      <p class="save-export-hint">
        A save from the photo you showed was recognised. Load it back onto
        the booth pot?
      </p>
      <div class="save-confirm-id"></div>
      <div class="save-confirm-actions">
        <button class="save-confirm-btn cancel" type="button">Cancel</button>
        <button class="save-confirm-btn ok" type="button">Load pot</button>
      </div>
    </div>
  `;

  confirmEl.addEventListener("click", (e) => {
    if (e.target === confirmEl) {
      closeConfirm(false);
    }
  });

  confirmEl.querySelector(".cancel").addEventListener("click", () => closeConfirm(false));
  confirmEl.querySelector(".ok").addEventListener("click", () => closeConfirm(true));

  document.body.appendChild(confirmEl);
  return confirmEl;
}

function closeConfirm(result) {
  if (pendingResolve) {
    pendingResolve(result);
    pendingResolve = null;
  }
  if (confirmEl) {
    confirmEl.classList.remove("open");
  }
}

export function showLoadConfirm({ id }) {
  const el = build();
  el.querySelector(".save-confirm-id").textContent = `Save code: ${formatSaveCode(id)}`;

  el.classList.add("open");

  return new Promise((resolve) => {
    pendingResolve = resolve;
  });
}