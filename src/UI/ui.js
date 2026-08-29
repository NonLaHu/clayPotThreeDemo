import "./ui.css";

let currentIcon = "activity";
import { PATTERNS } from "../core/constants.js";
import { state } from "../core/state.js";
const SCULPT_ROOM = "sculpt_room";
const PAINT_ROOM = "paint_room";
const DRAW_ROOM = "draw";

const GESTURE_GUIDES = {
  [SCULPT_ROOM]: [
    {
      title: "Point Finger",
      desc: "Aim the sculpting point on the pot",
    },
    {
      title: "Pinch (Thumb + Index)",
      desc: "Adjust pot radius / thickness",
    },
    {
      title: "Victory Sign (Index + Middle)",
      desc: "Stretch or compress height",
    },
    {
      title: "Open Palm",
      desc: "Tilt & rotate camera view",
    },
  ],
  [PAINT_ROOM]: [
    {
      title: "Point Finger",
      desc: "Aim the paint height on the pot",
    },
    {
      title: "Pinch (Thumb + Index)",
      desc: "Paint a horizontal band of the selected color",
    },
    {
      title: "Spider-Man (Index + Pinky)",
      desc: "Toggle the sunflower color picker",
    },
    {
      title: "Rotate Hand",
      desc: "Sweep the color wheel to pick a color",
    },
    {
      title: "Open Palm",
      desc: "Tilt & rotate camera view",
    },
  ],
  [DRAW_ROOM]: [
    {
      title: "Point Finger",
      desc: "Aim the pattern placement on the pot",
    },
    {
      title: "Pinch (Thumb + Index)",
      desc: "Stamp the selected pattern",
    },
    {
      title: "Spider-Man (Index + Pinky)",
      desc: "Toggle the pattern picker wheel",
    },
    {
      title: "Open Palm",
      desc: "Tilt & rotate camera view",
    },
  ],
};

function renderGestureGuide(room) {
  const items = GESTURE_GUIDES[room] || GESTURE_GUIDES[SCULPT_ROOM];

  return `
    <div class="dropdown-header">Supported Controls</div>

    ${items
      .map(
        (item) => `
          <div class="gesture-item">
            <div>
              <strong>${item.title}</strong>
              <span>${item.desc}</span>
            </div>
          </div>
        `,
      )
      .join("")}
  `;
}

export function initUI({
  onReset,
  onExport,
  onSoundToggle,
  onDone,
  onLoad,
  onUndo,
  onGestureTest,
}) {
  if (document.getElementById("ui-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "ui-overlay";

  overlay.innerHTML = `
    <!-- =========================
         Top-Left HUD
    ========================== -->

    <div class="hud-left-group">

      <div class="hud-card">
        <span class="hud-dot"></span>

        <i
          id="hud-status-icon"
          data-feather="activity"
          class="hud-icon"
        ></i>

        <div class="gesture-info">
          <span id="gesture-name" class="gesture-name">
            No Gesture
          </span>
          <span id="gesture-mode" class="gesture-mode">
            Waiting...
          </span>
          <span id="gesture-room" class="gesture-room">
            Sculpt Room
          </span>
        </div>
      </div>


      <!-- =========================
           Gesture Guide
      ========================== -->

      <div class="hud-dropdown-wrapper">

        <button
          id="gesture-menu-btn"
          class="hud-btn secondary"
        >
          <i data-feather="help-circle"></i>

          <span>Gestures Guide</span>

          <i
            data-feather="chevron-down"
            class="chevron"
          ></i>
        </button>


        <div
          id="gesture-menu"
          class="hud-dropdown"
        ></div>

      </div>


      <!-- =========================
           Gesture Test
      ========================== -->

      <button
        id="gesture-test-btn"
        class="hud-btn secondary"
      >
        <i data-feather="video"></i>

        <span>Gesture Test</span>
      </button>

    </div>


    <!-- =========================
         Top-Right Controls
    ========================== -->

    <div class="hud-controls">

      <!-- Sound -->

      <button
        id="btn-sound"
        class="hud-btn icon-only"
        title="Enable sound"
      >
        <i
          id="sound-icon"
          data-feather="volume-x"
        ></i>
      </button>


      <!-- Done -->

      <button
        id="btn-done"
        class="hud-btn done-button"
        title="Finish sculpting"
      >
        <i data-feather="check"></i>
        <span>Done</span>
      </button>


      <!-- Reset -->

      <button
        id="btn-reset"
        class="hud-btn"
      >
        <i data-feather="rotate-ccw"></i>
        <span>Reset Pot</span>
      </button>

      <!-- Undo -->

      <button
        id="btn-undo"
        class="hud-btn"
        style="display: none;"
        title="Undo last pattern"
      >
        <i data-feather="corner-up-left"></i>
        <span>Undo</span>
      </button>


      <!-- Load Progress -->

      <button
        id="btn-load"
        class="hud-btn"
        title="Load a saved pot by code"
      >
        <i data-feather="upload-cloud"></i>
        <span>Load Progress</span>
      </button>


      <!-- Export -->

      <button
        id="btn-export"
        class="hud-btn primary"
      >
        <i data-feather="download"></i>
        <span>Export PNG</span>
      </button>

    </div>
  `;

  document.body.appendChild(overlay);


  // =========================
  // Feather Icons
  // =========================

  if (window.feather) {
    window.feather.replace();
  }


  // =========================
  // Buttons
  // =========================

  document
    .getElementById("btn-reset")
    .addEventListener(
      "click",
      onReset,
    );


  document
    .getElementById("btn-export")
    .addEventListener(
      "click",
      onExport,
    );


  document
    .getElementById("btn-load")
    .addEventListener(
      "click",
      onLoad,
    );


  document
    .getElementById("btn-done")
    .addEventListener(
      "click",
      onDone,
    );

  const undoButton =
    document.getElementById(
      "btn-undo"
    );

  if (undoButton && onUndo) {
    undoButton.addEventListener(
      "click",
      onUndo,
    );
  }


  // =========================
  // Gesture Test Button
  // =========================

  const gestureTestBtn =
    document.getElementById(
      "gesture-test-btn",
    );

  if (gestureTestBtn && onGestureTest) {
    gestureTestBtn.addEventListener(
      "click",
      onGestureTest,
    );
  }


  // =========================
  // Gesture Dropdown
  // =========================

  const menuBtn =
    document.getElementById(
      "gesture-menu-btn",
    );

  const menu =
    document.getElementById(
      "gesture-menu",
    );

  menu.innerHTML =
    renderGestureGuide(
      SCULPT_ROOM,
    );

  if (window.feather) {
    window.feather.replace();
  }


  menuBtn.addEventListener(
    "click",
    (e) => {
      e.stopPropagation();

      menu.classList.toggle(
        "open",
      );

      menuBtn.classList.toggle(
        "active",
      );
    },
  );


  document.addEventListener(
    "click",
    () => {
      menu.classList.remove(
        "open",
      );

      menuBtn.classList.remove(
        "active",
      );
    },
  );


  // =========================
  // Sound
  // =========================

  const soundButton =
    document.getElementById(
      "btn-sound",
    );

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


        // Only update UI
        // after successful callback

        soundEnabled =
          nextState;


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


        soundEnabled =
          false;


        updateSoundIcon();
      }
    },
  );
}


// =========================
// Gesture HUD
// =========================

export function updateGestureHUD(
  gestureName = "No Gesture",
  mode = "Waiting...",
  room = "Sculpt Room",
  iconName = "activity",
) {
  const gestureNameEl = document.getElementById("gesture-name");
  const gestureModeEl = document.getElementById("gesture-mode");
  const gestureRoomEl = document.getElementById("gesture-room");
  const iconEl = document.getElementById("hud-status-icon");

  if (gestureNameEl && gestureNameEl.textContent !== gestureName) {
    gestureNameEl.textContent = gestureName;
  }

  if (gestureModeEl && gestureModeEl.textContent !== mode) {
    gestureModeEl.textContent = mode;
  }

  if (gestureRoomEl && gestureRoomEl.textContent !== room) {
    gestureRoomEl.textContent = room;
  }

  if (iconEl && currentIcon !== iconName) {
    currentIcon = iconName;
    iconEl.setAttribute("data-feather", iconName);
    if (window.feather) {
      window.feather.replace();
    }
  }
}

// =========================
// Gesture Guide (per room)
// =========================

export function updateGestureGuide(
  room,
) {
  const menu =
    document.getElementById(
      "gesture-menu",
    );

  if (!menu) {
    return;
  }

  menu.innerHTML =
    renderGestureGuide(room);

  if (window.feather) {
    window.feather.replace();
  }
}

// =========================
// Pattern Panel Initialization
// =========================

let onPatternSelect = null;
let currentPatternIndex = 0;

export function updatePatternSelectionUI(index) {
  currentPatternIndex = index;

  const patternOptions =
    document.querySelectorAll(
      ".pattern-image-placeholder"
    );

  patternOptions.forEach(
    (option) => {
      const optionIndex =
        Number(
          option.dataset.patternIndex
        );

      option.classList.toggle(
        "selected",
        optionIndex === index
      );
    }
  );
}

export function setPatternSelectCallback(callback) {
  onPatternSelect = callback;
}
export function initPatternPanel() {
  const patternPanel =
    document.getElementById(
      "pattern-panel"
    );

  if (!patternPanel) {
    return;
  }

  const patternGrid =
    document.getElementById(
      "pattern-grid"
    );

  if (!patternGrid) {
    return;
  }

  // ==========================================================
  // GENERATE PATTERN OPTIONS
  // ==========================================================

  patternGrid.innerHTML =
    PATTERNS
      .map(
        (pattern, index) => `
          <div
            class="pattern-image-placeholder"
            data-pattern-index="${index}"
          >
            <img
              src="${pattern.src}"
              alt="${pattern.id}"
              draggable="false"
            />

            <div class="placeholder-content">
              <span>${pattern.id}</span>
            </div>
          </div>
        `
      )
      .join("");


  // ==========================================================
  // COLLAPSIBLE SECTIONS
  // ==========================================================

  const sectionHeaders =
    patternPanel.querySelectorAll(
      ".pattern-section-header"
    );

  sectionHeaders.forEach(
    (header) => {
      header.addEventListener(
        "click",
        () => {
          const section =
            header.closest(
              ".pattern-section"
            );

          section.classList.toggle(
            "collapsed"
          );
        }
      );
    }
  );


  // ==========================================================
  // PATTERN SELECTION
  // ==========================================================

  const patternOptions =
    patternGrid.querySelectorAll(
      ".pattern-image-placeholder"
    );

  patternOptions.forEach(
    (option) => {
      option.addEventListener(
        "click",
        () => {

          const patternIndex =
            Number(
              option.dataset.patternIndex
            );

          updatePatternSelectionUI(
            patternIndex
          );

          console.log(
            "Pattern selected:",
            patternIndex
          );

          if (
            onPatternSelect &&
            typeof onPatternSelect ===
              "function"
          ) {
            onPatternSelect(
              patternIndex
            );
          }
        }
      );
    }
  );


  // ==========================================================
  // SEE ALL
  // ==========================================================

  const seeAllBtn =
    patternPanel.querySelector(
      ".see-all-btn"
    );

  if (seeAllBtn) {
    seeAllBtn.addEventListener(
      "click",
      () => {
        console.log(
          "See all patterns clicked"
        );
      }
    );
  }


  // ==========================================================
  // FEATHER
  // ==========================================================

  if (window.feather) {
    window.feather.replace();
  }
}
export function updateStageUI() {
  const undoButton =
    document.getElementById(
      "btn-undo"
    );

  if (!undoButton) {
    return;
  }

  undoButton.style.display = "flex";

}

// =========================
// Color Lock Timer UI
// =========================

export function createColorLockTimer() {
  if (document.getElementById("color-lock-timer")) return;

  const timerContainer = document.createElement("div");
  timerContainer.id = "color-lock-timer";
  timerContainer.className = "color-lock-timer";
  
  timerContainer.innerHTML = `
    <svg class="timer-circle" viewBox="0 0 100 100">
      <circle class="timer-bg" cx="50" cy="50" r="45"></circle>
      <circle class="timer-progress" cx="50" cy="50" r="45"></circle>
    </svg>
    <div class="timer-text">5</div>
  `;
  
  document.body.appendChild(timerContainer);
}

export function showColorLockTimer() {
  const timer = document.getElementById("color-lock-timer");
  if (timer) {
    timer.style.display = "flex";
  }
}

export function hideColorLockTimer() {
  const timer = document.getElementById("color-lock-timer");
  if (timer) {
    timer.style.display = "none";
  }
}

export function updateColorLockTimer(progress) {
  const timer = document.getElementById("color-lock-timer");
  if (!timer) return;
  
  const progressCircle = timer.querySelector(".timer-progress");
  const timerText = timer.querySelector(".timer-text");
  
  // Update circular progress (stroke-dasharray: circumference, stroke-dashoffset)
  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - progress);
  progressCircle.style.strokeDashoffset = offset;
  
  // Update countdown text using actual duration from state
  const durationSeconds = state.paint.colorLockDuration / 1000;
  const remainingSeconds = Math.ceil(durationSeconds * (1 - progress));
  timerText.textContent = remainingSeconds;
}

// =========================
// Thumbs Up Timer UI
// =========================

export function createThumbsUpTimer() {
  if (document.getElementById("thumbs-up-timer")) return;

  const timerContainer = document.createElement("div");
  timerContainer.id = "thumbs-up-timer";
  timerContainer.className = "thumbs-up-timer";
  
  timerContainer.innerHTML = `
    <svg class="thumbs-up-timer-circle" viewBox="0 0 100 100">
      <circle class="thumbs-up-timer-bg" cx="50" cy="50" r="45"></circle>
      <circle class="thumbs-up-timer-progress" cx="50" cy="50" r="45"></circle>
    </svg>
    <div class="thumbs-up-timer-text">2</div>
  `;
  
  document.body.appendChild(timerContainer);
}

export function showThumbsUpTimer() {
  const timer = document.getElementById("thumbs-up-timer");
  if (timer) {
    timer.style.display = "flex";
  }
}

export function hideThumbsUpTimer() {
  const timer = document.getElementById("thumbs-up-timer");
  if (timer) {
    timer.style.display = "none";
  }
}

export function updateThumbsUpTimer(progress) {
  const timer = document.getElementById("thumbs-up-timer");
  if (!timer) return;
  
  const progressCircle = timer.querySelector(".thumbs-up-timer-progress");
  const timerText = timer.querySelector(".thumbs-up-timer-text");
  
  // Update circular progress
  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - progress);
  progressCircle.style.strokeDashoffset = offset;
  
  // Update countdown text
  const durationSeconds = state.thumbsUp.thumbsUpDuration / 1000;
  const remainingSeconds = Math.ceil(durationSeconds * (1 - progress));
  timerText.textContent = remainingSeconds;
}