import "./ui.css"; 

let currentIcon = "activity";

export function initUI({ onReset, onExport, onSoundToggle }) {
  if (document.getElementById("ui-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "ui-overlay";

  overlay.innerHTML = `
    <!-- Top-Left Area: Status + Gesture Reference Dropdown -->
    <div class="hud-left-group">
      <div class="hud-card">
        <span class="hud-dot"></span>
        <i id="hud-status-icon" data-feather="activity" class="hud-icon"></i>
        <span id="gesture-text">Waiting for hand gesture...</span>
      </div>

      <!-- Gestures Dropdown Menu -->
      <div class="hud-dropdown-wrapper">
        <button id="gesture-menu-btn" class="hud-btn secondary">
          <i data-feather="help-circle"></i>
          <span>Gestures Guide</span>
          <i data-feather="chevron-down" class="chevron"></i>
        </button>
        <div id="gesture-menu" class="hud-dropdown">
          <div class="dropdown-header">Supported Controls</div>
          <div class="gesture-item">
            <i data-feather="target"></i>
            <div>
              <strong>Point Finger</strong>
              <span>Sculpt / Deform specific point</span>
            </div>
          </div>
          <div class="gesture-item">
            <i data-feather="minimize-2"></i>
            <div>
              <strong>Pinch (Thumb + Index)</strong>
              <span>Adjust pot radius / thickness</span>
            </div>
          </div>
          <div class="gesture-item">
            <i data-feather="maximize-2"></i>
            <div>
              <strong>Victory Sign (Index + Middle)</strong>
              <span>Stretch or compress height</span>
            </div>
          </div>
          <div class="gesture-item">
            <i data-feather="edit-3"></i>
            <div>
              <strong>Open Palm</strong>
              <span>Tilt & rotate camera view</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top-Right Area: Action Buttons -->
    <div class="hud-controls">
      <button id="btn-sound" class="hud-btn icon-only" title="Enable sound">
        <i     id="sound-icon" data-feather="volume-x"></i>
      </button>

      <button id="btn-reset" class="hud-btn">
        <i data-feather="rotate-ccw"></i>
        <span>Reset Pot</span>
      </button>

      <button id="btn-export" class="hud-btn primary">
        <i data-feather="download"></i>
        <span>Export PNG</span>
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Safely replace Feather Icons
  if (window.feather) {
    window.feather.replace();
  }

  // Setup Event Listeners
  document.getElementById("btn-reset").addEventListener("click", onReset);
  document.getElementById("btn-export").addEventListener("click", onExport);

  // Dropdown Toggle Logic
  const menuBtn = document.getElementById("gesture-menu-btn");
  const menu = document.getElementById("gesture-menu");

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("open");
    menuBtn.classList.toggle("active");
  });

  document.addEventListener("click", () => {
    menu.classList.remove("open");
    menuBtn.classList.remove("active");
  });
  const soundButton =
  document.getElementById("btn-sound");

let soundEnabled = false;

function updateSoundIcon() {
  const iconName =
    soundEnabled
      ? "volume-2"
      : "volume-x";

  soundButton.innerHTML = `
    <i
      id="sound-icon"
      data-feather="${iconName}"
    ></i>
  `;

  soundButton.title =
    soundEnabled
      ? "Disable sound"
      : "Enable sound";

  if (window.feather) {
    window.feather.replace();
  }
}

soundButton.addEventListener(
  "click",
  async () => {
    const nextState =
      !soundEnabled;

    console.log(
      "Sound toggle:",
      nextState
        ? "ON"
        : "OFF",
    );

    try {
      await onSoundToggle(
        nextState,
      );

      soundEnabled = nextState;

      updateSoundIcon();

      console.log(
        "Sound state:",
        soundEnabled
          ? "ON"
          : "OFF",
      );
    } catch (error) {
      console.error(
        "Sound toggle failed:",
        error,
      );

      soundEnabled = false;

      updateSoundIcon();
    }
  },
);
}

export function updateGestureHUD(message, iconName = "activity") {
  const textEl = document.getElementById("gesture-text");
  const iconEl = document.getElementById("hud-status-icon");

  if (textEl && textEl.textContent !== message) {
    textEl.textContent = message;
  }

  if (iconEl && currentIcon !== iconName) {
    currentIcon = iconName;
    iconEl.setAttribute("data-feather", iconName);
    if (window.feather) {
      window.feather.replace();
    }
  }
}
