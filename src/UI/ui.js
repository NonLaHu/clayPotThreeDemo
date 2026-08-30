import "./ui.css";

import { formatUnits } from "../core/measure.js";

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
  onView3D,
}) {
  if (document.getElementById("ui-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "ui-overlay";

  overlay.innerHTML = `
    <!-- =========================
         Top-Left Gesture Widget
         (active gesture + guide "?" + test, all in one pill)
    ========================== -->

    <div class="hud-left-group">

      <div class="hud-card gesture-widget">

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

        <div class="gesture-widget-icons">

          <div class="hud-dropdown-wrapper">
            <button
              id="gesture-menu-btn"
              class="hud-icon-btn tool-btn"
              title="Gestures guide"
              aria-label="Gestures guide"
            >?</button>

            <div
              id="gesture-menu"
              class="hud-dropdown"
            ></div>
          </div>

          <button
            id="gesture-test-btn"
            class="hud-icon-btn tool-btn"
            title="Gesture test"
            aria-label="Gesture test"
          >
            <i data-feather="video"></i>
          </button>

        </div>

      </div>

    </div>


    <!-- =========================
         Top-Right Controls
         (Done, Save, hamburger menu)
    ========================== -->

    <div class="hud-controls">

      <!-- Done -->

      <button
        id="btn-done"
        class="hud-btn"
        title="Finish sculpting"
      >
        <i data-feather="check"></i>
        <span>Done</span>
      </button>


      <!-- Save / Export -->

      <button
        id="btn-export"
        class="hud-btn primary"
      >
        <i data-feather="download"></i>
        <span>Save</span>
      </button>


      <!-- Hamburger menu -->

      <div class="hud-menu-wrapper">

        <button
          id="btn-menu"
          class="hud-btn icon-only hud-menu-toggle"
          title="More options"
          aria-label="More options"
        >
          <i data-feather="menu"></i>
        </button>

        <div
          id="hud-menu"
          class="hud-menu"
        >

          <!-- Sound -->
          <button
            id="btn-sound"
            class="hud-menu-item"
            title="Enable sound"
          >
            <i
              id="sound-icon"
              data-feather="volume-x"
            ></i>
            <span>Sound</span>
          </button>

          <!-- Reset -->
          <button
            id="btn-reset"
            class="hud-menu-item"
            title="Reset pot to its starting shape"
          >
            <i data-feather="rotate-ccw"></i>
            <span>Reset Pot</span>
          </button>

          <!-- Undo -->
          <button
            id="btn-undo"
            class="hud-menu-item"
            style="display: none;"
            title="Undo last pattern"
          >
            <i data-feather="corner-up-left"></i>
            <span>Undo</span>
          </button>

          <!-- Load Progress -->
          <button
            id="btn-load"
            class="hud-menu-item"
            title="Load a saved pot by code"
          >
            <i data-feather="upload-cloud"></i>
            <span>Load Progress</span>
          </button>

          <!-- 3D Viewer -->
          <button
            id="btn-3dviewer"
            class="hud-menu-item"
            title="Open a saved pot in the 3D viewer"
          >
            <i data-feather="box"></i>
            <span>3D Viewer</span>
          </button>

        </div>

      </div>

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


  // =========================
  // 3D Viewer
  // =========================

  const viewerBtn =
    document.getElementById(
      "btn-3dviewer",
    );

  if (viewerBtn && onView3D) {
    viewerBtn.addEventListener(
      "click",
      onView3D,
    );
  }


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


  // =========================
  // Hamburger menu (top-right)
  // =========================

  const menuToggle =
    document.getElementById(
      "btn-menu",
    );

  const hudMenu =
    document.getElementById(
      "hud-menu",
    );

  if (menuToggle && hudMenu) {
    menuToggle.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();

        hudMenu.classList.toggle(
          "open",
        );

        menuToggle.classList.toggle(
          "active",
        );
      },
    );

    // Clicking an item closes the menu.
    hudMenu.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
      },
    );
  }


  document.addEventListener(
    "click",
    () => {
      menu.classList.remove(
        "open",
      );

      menuBtn.classList.remove(
        "active",
      );

      if (hudMenu) {
        hudMenu.classList.remove(
          "open",
        );

        menuToggle.classList.remove(
          "active",
        );
      }
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

// =========================
// Measurements readout
// (bottom-right, above the webcam preview)
// =========================
//
// The chip shows one metric by default (height). Clicking it opens a drop-up
// panel that reveals the other measurements (width / radius). Selecting a row
// makes that metric the one displayed in the chip.

const MEASURE_MODES = [
  { id: "height", label: "Height", get: (m) => m.height },
  { id: "width", label: "Max Ø", get: (m) => m.maxDiameter },
  { id: "radius", label: "Radius", get: (m) => m.maxRadius },
];

let measureMode = "height";
let measureReadoutEl = null;
let measureChipValue = null;
let measureRows = null;

export function createMeasurementsReadout() {
  if (document.getElementById("measure-readout")) return;

  measureReadoutEl = document.createElement("div");
  measureReadoutEl.id = "measure-readout";
  measureReadoutEl.className = "measure-readout";

  measureReadoutEl.innerHTML = `
    <button id="measure-chip" class="measure-chip" type="button" aria-haspopup="true" aria-expanded="false">
      <span class="measure-chip-label"></span>
      <span class="measure-chip-value"></span>
      <i data-feather="chevron-up" class="measure-caret"></i>
    </button>

    <div id="measure-dropup" class="measure-dropup" role="menu">
      <div class="measure-dropup-title">Dimensions (cm · in)</div>
      <div class="measure-dropup-rows"></div>
    </div>
  `;

  document.body.appendChild(measureReadoutEl);

  const chip = measureReadoutEl.querySelector("#measure-chip");
  const dropup = measureReadoutEl.querySelector("#measure-dropup");
  const rowsWrap = measureReadoutEl.querySelector(".measure-dropup-rows");

  measureRows = MEASURE_MODES.map((mode) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "measure-row";
    row.dataset.mode = mode.id;

    row.innerHTML = `
      <span class="measure-row-label">${mode.label}</span>
      <span class="measure-row-value"></span>
    `;

    row.addEventListener("click", (e) => {
      e.stopPropagation();
      setMeasureMode(mode.id);
      closeMeasureDropup();
    });

    rowsWrap.appendChild(row);
    return row;
  });

  chip.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropup.classList.contains("open");
    if (isOpen) {
      closeMeasureDropup();
    } else {
      dropup.classList.add("open");
      chip.setAttribute("aria-expanded", "true");
    }
  });

  document.addEventListener("click", () => closeMeasureDropup());

  renderMeasureRows();
  updateMeasureChip(null);
}

function closeMeasureDropup() {
  if (!measureReadoutEl) return;
  const dropup = measureReadoutEl.querySelector("#measure-dropup");
  const chip = measureReadoutEl.querySelector("#measure-chip");
  if (dropup) dropup.classList.remove("open");
  if (chip) chip.setAttribute("aria-expanded", "false");
}

function setMeasureMode(id) {
  measureMode = MEASURE_MODES.some((m) => m.id === id) ? id : "height";
  renderMeasureRows();
  updateMeasureChip(null);
}

function renderMeasureRows() {
  if (!measureRows) return;
  measureRows.forEach((row) => {
    row.classList.toggle(
      "active",
      row.dataset.mode === measureMode,
    );
  });
}

function updateMeasureChip(measurements) {
  if (!measureReadoutEl) return;

  const mode = MEASURE_MODES.find((m) => m.id === measureMode);

  const chipLabel = measureReadoutEl.querySelector(".measure-chip-label");
  const chipValue = measureReadoutEl.querySelector(".measure-chip-value");

  if (chipLabel && chipLabel.textContent !== mode.label) {
    chipLabel.textContent = mode.label;
  }

  // Update chip value (guarded against churn: only when the text changes).
  if (measurements && mode) {
    const text = formatUnits(mode.get(measurements));
    if (chipValue && chipValue.textContent !== text) {
      chipValue.textContent = text;
    }
  }

  // Update every row in the drop-up.
  if (measureRows && measurements) {
    MEASURE_MODES.forEach((m) => {
      const row = measureRows.find((r) => r.dataset.mode === m.id);
      const valueEl = row && row.querySelector(".measure-row-value");
      if (valueEl) {
        const text = formatUnits(m.get(measurements));
        if (valueEl.textContent !== text) {
          valueEl.textContent = text;
        }
      }
    });
  }
}

/**
 * Refreshes the measurements readout with freshly computed scene-unit
 * measurements. Called on a throttled cadence (~5s) from the animation loop.
 */
export function updateMeasurementsUI(measurements) {
  if (!measureReadoutEl) {
    createMeasurementsReadout();
  }
  updateMeasureChip(measurements);
}
