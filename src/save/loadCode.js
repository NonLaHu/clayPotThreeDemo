import "./saveOverlay.css";

import { normalizeSaveCode } from "./code.js";

let modalEl = null;
let inputEl = null;
let errorEl = null;
let pendingState = null;
let busy = false;

function build() {
  if (modalEl) {
    return modalEl;
  }

  modalEl = document.createElement("div");
  modalEl.id = "save-code-overlay";
  modalEl.className = "save-export";

  modalEl.innerHTML = `
    <div class="save-export-card save-code-card">
      <button class="save-export-close" type="button" aria-label="Close">&times;</button>

      <h2 class="save-export-title">Load your pot</h2>

      <p class="save-export-hint">
        Enter the save code from your poster photo to reload your pot.
      </p>

      <input
        class="save-code-input"
        type="text"
        inputmode="text"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        placeholder="e.g. AB12 CD34"
      />

      <p class="save-code-error" role="alert"></p>

      <div class="save-confirm-actions">
        <button class="save-confirm-btn cancel" type="button">Cancel</button>
        <button class="save-confirm-btn ok" type="button">Load pot</button>
      </div>
    </div>
  `;

  inputEl = modalEl.querySelector(".save-code-input");
  errorEl = modalEl.querySelector(".save-code-error");

  const cancelBtn = modalEl.querySelector(".cancel");
  const okBtn = modalEl.querySelector(".ok");

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) {
      dismiss(false);
    }
  });

  modalEl.querySelector(".save-export-close").addEventListener("click", () => {
    dismiss(false);
  });

  cancelBtn.addEventListener("click", () => {
    dismiss(false);
  });

  okBtn.addEventListener("click", submit);

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  });

  document.body.appendChild(modalEl);
  return modalEl;
}

async function submit() {
  if (busy || !pendingState) {
    return;
  }

  const code = normalizeSaveCode(inputEl.value);

  if (!code) {
    setError("Please enter the save code from your poster.");
    return;
  }

  busy = true;
  setError(null);

  try {
    const result = await pendingState.onLoad(code);

    if (result === false) {
      busy = false;
      return;
    }

    pendingState.resolve(true);
    pendingState = null;
    busy = false;
    hide();
  } catch (error) {
    setError(
      error && error.message
        ? error.message
        : "Could not load that save. Please check the code and try again.",
    );
    busy = false;
  }
}

function setError(message) {
  errorEl.textContent = message || "";
}

function dismiss(result) {
  if (busy || !pendingState) {
    return;
  }
  pendingState.resolve(result);
  pendingState = null;
  hide();
}

function hide() {
  if (modalEl) {
    modalEl.classList.remove("open");
  }
}

/**
 * Opens the "Load Progress" prompt.
 *
 * `options.onLoad(code)` is called with the normalized code once the student
 * hits Load. It should return `true` when a pot was loaded (modal closes and
 * the promise resolves true) or `false` to keep the modal open without an
 * error (e.g. the student backed out of the confirm dialog). If it throws, the
 * error message is shown in the modal and the promise stays pending so the
 * student can try again. Cancelling (or closing the overlay) resolves false.
 */
export function showLoadCode(options) {
  const el = build();

  inputEl.value = "";
  setError(null);

  el.classList.add("open");
  setTimeout(() => inputEl.focus(), 0);

  return new Promise((resolve) => {
    pendingState = { onLoad: options.onLoad, resolve };
  });
}
