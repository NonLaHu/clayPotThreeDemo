import "./ui.css";

let currentIcon = "activity";

const SCULPT_ROOM = "sculpt_room";
const PAINT_ROOM = "paint_room";

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

        <span id="gesture-text">
          Waiting for hand gesture...
        </span>
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
    .getElementById("btn-done")
    .addEventListener(
      "click",
      onDone,
    );


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
  message,
  iconName = "activity",
) {
  const textEl =
    document.getElementById(
      "gesture-text",
    );

  const iconEl =
    document.getElementById(
      "hud-status-icon",
    );


  if (
    textEl &&
    textEl.textContent !== message
  ) {
    textEl.textContent =
      message;
  }


  if (
    iconEl &&
    currentIcon !== iconName
  ) {

    currentIcon =
      iconName;


    iconEl.setAttribute(
      "data-feather",
      iconName,
    );


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