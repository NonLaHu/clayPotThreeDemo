import "./saveOverlay.css";

let modalEl = null;
let inputEl = null;
let pendingResolve = null;

function build() {
  if (modalEl) return modalEl;

  modalEl = document.createElement("div");
  modalEl.id = "creator-name-overlay";
  modalEl.className = "save-export";

  modalEl.innerHTML = `
    <div class="save-export-card save-code-card">
      <button class="save-export-close" type="button" aria-label="Close">&times;</button>

      <h2 class="save-export-title">Who made this?</h2>

      <p class="save-export-hint">
        Enter your name to print on the poster.
      </p>

      <input
        class="save-code-input creator-name-input"
        id="creator-name-input"
        type="text"
        inputmode="text"
        autocomplete="off"
        spellcheck="false"
        placeholder="e.g. Alice"
        maxlength="40"
      />

      <div class="save-confirm-actions">
        <button class="save-confirm-btn cancel" type="button">Cancel</button>
        <button class="save-confirm-btn ok" type="button">Print</button>
      </div>
    </div>
  `;

  inputEl = modalEl.querySelector("#creator-name-input");

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) dismiss(null);
  });

  modalEl.querySelector(".save-export-close").addEventListener("click", () => {
    dismiss(null);
  });

  modalEl.querySelector(".cancel").addEventListener("click", () => {
    dismiss(null);
  });

  modalEl.querySelector(".ok").addEventListener("click", submit);

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  });

  document.body.appendChild(modalEl);
  return modalEl;
}

function submit() {
  if (!pendingResolve) return;

  const name = inputEl.value.trim();
  dismiss(name || null);
}

function dismiss(result) {
  if (!pendingResolve) return;

  const resolve = pendingResolve;
  pendingResolve = null;
  hide();
  resolve(result);
}

function hide() {
  if (modalEl) {
    modalEl.classList.remove("open");
  }
}

/**
 * Shows a prompt asking for the creator's name.
 * Returns a Promise that resolves with the name string, or null if cancelled.
 */
export function showCreatorNamePrompt() {
  const el = build();
  inputEl.value = "";
  el.classList.add("open");
  setTimeout(() => inputEl.focus(), 0);

  return new Promise((resolve) => {
    pendingResolve = resolve;
  });
}
