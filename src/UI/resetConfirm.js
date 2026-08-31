let confirmEl = null;
let pendingResolve = null;

function build() {
  if (confirmEl) {
    return confirmEl;
  }

  confirmEl = document.createElement("div");
  confirmEl.id = "reset-confirm";
  confirmEl.className = "reset-confirm";

  confirmEl.innerHTML = `
    <div class="reset-confirm-card">
      <h2 class="reset-confirm-title">Reset your pot?</h2>
      <p class="reset-confirm-hint">
        This will erase all your shape, color and pattern work and bring you
        back to the start.
      </p>
      <div class="reset-confirm-actions">
        <button class="reset-confirm-btn cancel" type="button">Cancel</button>
        <button class="reset-confirm-btn ok" type="button">Reset pot</button>
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

export function confirmReset() {
  const el = build();
  el.classList.add("open");

  return new Promise((resolve) => {
    pendingResolve = resolve;
  });
}