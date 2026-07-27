import * as THREE from "three";
import "./style.css";

import { setupEnvironment } from "./environment.js";
import { setupPaintingEnvironment } from "./paintingEnvironment.js";
import { initHand, detectHand } from "./hand.js";

import {
  initUI,
  updateGestureHUD,
} from "./UI/ui.js";

import {
  initSound,
  resumeSound,
  setSoundEnabled,
  updateWheelSound,
  updateSculptSound,
  stopSculptSound,
} from "./sound.js";

const DEBUG = true;

// ============================================================
// ROOM STATE
// ============================================================

const ROOM_STATE = {
  SCULPT_ROOM: "sculpt_room",
  PAINT_ROOM: "paint_room",
};

let currentRoom = ROOM_STATE.SCULPT_ROOM;

let sculptingEnvironmentGroup = null;
let paintingEnvironmentGroup = null;

let selectedColor = "#B56535";

// ============================================================
// DEBUG CAMERA VIDEO
// ============================================================

const video = document.createElement("video");

video.autoplay = true;
video.playsInline = true;
video.muted = true;

if (DEBUG) {
  video.style.position = "fixed";
  video.style.bottom = "10px";
  video.style.right = "10px";
  video.style.width = "320px";
  video.style.zIndex = "9999";
  video.style.transform = "scaleX(-1)";

  document.body.appendChild(video);
}

// ============================================================
// HAND CONNECTIONS
// ============================================================

const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],

  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],

  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],

  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],

  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],

  [0, 17],
];

// ============================================================
// DEBUG CANVAS
// ============================================================

let debugCanvas;
let debugCtx;

if (DEBUG) {
  debugCanvas = document.createElement("canvas");

  debugCanvas.width = 320;
  debugCanvas.height = 240;

  debugCanvas.style.position = "fixed";
  debugCanvas.style.bottom = "10px";
  debugCanvas.style.right = "10px";
  debugCanvas.style.zIndex = "10000";
  debugCanvas.style.pointerEvents = "none";

  document.body.appendChild(debugCanvas);

  debugCtx = debugCanvas.getContext("2d");
}

// ============================================================
// GESTURE STATE
// ============================================================

let lastHeightY = null;

let pinchActive = false;
let pinchStartX = 0;

// ============================================================
// PAINTING STATE
// ============================================================

const PAINT_RING_WIDTH = 2;

let lastPaintY = null;
let paintingActive = false;

// ============================================================
// CAMERA / WEBCAM
// ============================================================

async function startCamera() {
  const stream =
    await navigator.mediaDevices.getUserMedia({
      video: {
        width: 640,
        height: 480,
      },
    });

  video.srcObject = stream;

  await video.play();

  console.log("camera ready");
}

// ============================================================
// SCENE
// ============================================================

const scene = new THREE.Scene();

scene.background =
  new THREE.Color(0x111111);

// ============================================================
// SCULPTING ENVIRONMENT
// ============================================================

sculptingEnvironmentGroup =
  new THREE.Group();

setupEnvironment(
  sculptingEnvironmentGroup,
);

scene.add(
  sculptingEnvironmentGroup,
);

// ============================================================
// PAINTING ENVIRONMENT
// ============================================================

paintingEnvironmentGroup =
  new THREE.Group();

setupPaintingEnvironment(
  paintingEnvironmentGroup,
);

paintingEnvironmentGroup.visible = false;

scene.add(
  paintingEnvironmentGroup,
);

// ============================================================
// CAMERA
// ============================================================

const camera =
  new THREE.PerspectiveCamera(
    45,
    window.innerWidth /
      window.innerHeight,
    0.1,
    100,
  );

camera.position.set(
  3,
  2.5,
  5,
);

camera.lookAt(
  0,
  1,
  0,
);



// ============================================================
// SCULPT SETTINGS
// ============================================================

const BRUSH_HEIGHT = 0.25;

const raycaster =
  new THREE.Raycaster();

const mouse =
  new THREE.Vector2();

let sculptPoint = null;

let targetRadiusChange = 0;
let targetHeightChange = 0;

const CLAY_RESISTANCE = 0.05;
const MAX_FORCE = 0.005;

// ============================================================
// RENDERER
// ============================================================

const renderer =
  new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });

renderer.setSize(
  window.innerWidth,
  window.innerHeight,
);

document.body.appendChild(
  renderer.domElement,
);

// ============================================================
// CAMERA VERTICAL CONTROL
// ============================================================

let cameraAngle = 0.45;
let targetCameraAngle = cameraAngle;

function updateCamera() {
  const radius = 5;

  camera.position.y =
    2 +
    Math.sin(cameraAngle) *
      radius;

  camera.position.z =
    Math.cos(cameraAngle) *
      radius;

  camera.lookAt(
    0,
    1,
    0,
  );
}

// ============================================================
// CLAY POT GEOMETRY
// ============================================================

const points = [];

const MAX_HEIGHT = 4;
const INITIAL_HEIGHT = 2;

const segments = 64;
const thickness = 0.05;
// ============================================================
// CYLINDER WALL
// ============================================================

const CYLINDER_RADIUS = 0.7;

// Outer wall
for (let i = 0; i <= 40; i++) {
  const y =
    (i / 40) *
    INITIAL_HEIGHT;

  points.push(
    new THREE.Vector2(
      CYLINDER_RADIUS,
      y,
    ),
  );
}

// Inner wall
for (let i = 40; i >= 0; i--) {
  const y =
    (i / 40) *
    INITIAL_HEIGHT;

  points.push(
    new THREE.Vector2(
      CYLINDER_RADIUS - thickness,
      y,
    ),
  );
}

points.push(
  new THREE.Vector2(
    0,
    0.08,
  ),
);

// ============================================================
// CREATE POT
// ============================================================

const geometry =
  new THREE.LatheGeometry(
    points,
    segments,
  );

  // ============================================================
// PAINT VERTEX COLORS
// ============================================================

const vertexColors =
  new Float32Array(
    geometry.attributes.position.count * 3,
  );

for (
  let i = 0;
  i < geometry.attributes.position.count;
  i++
) {
  vertexColors[i * 3] = 0.71;
  vertexColors[i * 3 + 1] = 0.396;
  vertexColors[i * 3 + 2] = 0.208;
}

geometry.setAttribute(
  "color",
  new THREE.BufferAttribute(
    vertexColors,
    3,
  ),
);

const material =
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0,
    side: THREE.DoubleSide,
    vertexColors: true,
  });

const pot =
  new THREE.Mesh(
    geometry,
    material,
  );

scene.add(pot);

// ============================================================
// SOUND
// ============================================================

initSound();

// ============================================================
// CLAY STATE
// ============================================================

const initialClayPositions =
  geometry.attributes.position.array.slice();

const clayPositions =
  geometry.attributes.position.array.slice();

// ============================================================
// TRANSITION: SCULPT -> PAINT
// ============================================================

function transitionToPaintRoom() {
  if (
    currentRoom !==
    ROOM_STATE.SCULPT_ROOM
  ) {
    return;
  }

  const transitionOverlay =
    document.getElementById(
      "transition-overlay",
    );

  const colorSelector =
    document.getElementById(
      "color-selector",
    );

  const paintingControls =
    document.getElementById(
      "painting-controls",
    );

  const paintingDoneButton =
    document.getElementById(
      "painting-done-button",
    );

  if (transitionOverlay) {
    transitionOverlay.classList.add(
      "active",
    );
  }

  setTimeout(() => {
    // --------------------------------------------------------
    // Hide sculpt room
    // --------------------------------------------------------

    sculptingEnvironmentGroup.visible =
      false;

    // --------------------------------------------------------
    // Show paint room
    // --------------------------------------------------------

    paintingEnvironmentGroup.visible =
      true;

    // --------------------------------------------------------
    // Stop sculpting audio
    // --------------------------------------------------------

    updateWheelSound(0);
    stopSculptSound();

    // --------------------------------------------------------
    // Painting UI
    // --------------------------------------------------------

    if (colorSelector) {
      colorSelector.classList.add(
        "visible",
      );
    }

    if (paintingControls) {
      paintingControls.classList.add(
        "visible",
      );
    }

    if (paintingDoneButton) {
      paintingDoneButton.classList.add(
        "visible",
      );
    }

    // --------------------------------------------------------
    // Change room
    // --------------------------------------------------------

    currentRoom =
      ROOM_STATE.PAINT_ROOM;

    // --------------------------------------------------------
    // Finish fade
    // --------------------------------------------------------

    setTimeout(() => {
      if (transitionOverlay) {
        transitionOverlay.classList.remove(
          "active",
        );
      }
    }, 100);
  }, 500);
}

// ============================================================
// UI
// ============================================================

initUI({
  // ----------------------------------------------------------
  // RESET
  // ----------------------------------------------------------

  onReset: () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to reset your pottery progress?",
      );

    if (!confirmed) {
      return;
    }

    const pos =
      geometry.attributes.position;

    for (
      let i = 0;
      i < pos.count * 3;
      i++
    ) {
      pos.array[i] =
        initialClayPositions[i];

      clayPositions[i] =
        initialClayPositions[i];
    }

    pos.needsUpdate = true;

    geometry.computeVertexNormals();
  },

  // ----------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------

  onExport: () => {
    renderer.render(
      scene,
      camera,
    );

    const image =
      renderer.domElement.toDataURL(
        "image/png",
      );

    const link =
      document.createElement("a");

    link.download =
      `clay-pot-${Date.now()}.png`;

    link.href = image;

    link.click();
  },

  // ----------------------------------------------------------
  // SOUND
  // ----------------------------------------------------------

  onSoundToggle: async (
    enabled,
  ) => {
    if (!enabled) {
      setSoundEnabled(false);
      return;
    }

    const state =
      await resumeSound();

    if (state !== "running") {
      throw new Error(
        "Audio could not be started.",
      );
    }

    setSoundEnabled(true);
  },

  // ----------------------------------------------------------
  // DONE
  // ----------------------------------------------------------

  onDone: () => {
    transitionToPaintRoom();
  },
});

// ============================================================
// GROUND
// ============================================================

const ground =
  new THREE.Mesh(
    new THREE.CylinderGeometry(
      1.2,
      1.2,
      0.1,
      64,
    ),

    new THREE.MeshStandardMaterial({
      color: 0x333333,
    }),
  );

ground.position.y =
  -0.05;

scene.add(ground);
// ============================================================
// PAINTING HIGHLIGHT
// ============================================================

const PAINT_RADIUS = 0.18;

const paintHighlightGeometry =
  new THREE.CylinderGeometry(
    0.76,                  // around the pot
    0.76,
    PAINT_RADIUS * 2,      // vertical paint band
    64,
    1,
    true,
  );

const paintHighlightMaterial =
  new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.20,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

const paintHighlight =
  new THREE.Mesh(
    paintHighlightGeometry,
    paintHighlightMaterial,
  );

paintHighlight.visible = false;

scene.add(
  paintHighlight,
);

// ============================================================
// LIGHTS
// ============================================================

scene.add(
  new THREE.HemisphereLight(
    0xffffff,
    0x444444,
    2,
  ),
);

const light =
  new THREE.DirectionalLight(
    0xffffff,
    2,
  );

light.position.set(
  3,
  5,
  3,
);

light.castShadow = true;

light.shadow.mapSize.width =
  1024;

light.shadow.mapSize.height =
  1024;

light.shadow.camera.near =
  0.5;

light.shadow.camera.far =
  50;

scene.add(light);

// ============================================================
// FINGER INDICATOR
// ============================================================

const targetFinger =
  new THREE.Vector3();

const finger =
  new THREE.Mesh(
    new THREE.SphereGeometry(
      0.05,
    ),

    new THREE.MeshBasicMaterial({
      color: 0xff0000,
    }),
  );

scene.add(finger);

// ============================================================
// HAND SETUP
// ============================================================

async function setup() {
  try {
    await startCamera();

    await initHand();

    console.log(
      "hand tracking + sound ready",
    );
  } catch (error) {
    console.error(
      "Setup failed:",
      error,
    );

    updateGestureHUD(
      "Camera unavailable",
      "alert-circle",
    );
  }
}

setup();

// ============================================================
// PAINTING UI
// ============================================================

const transitionOverlay =
  document.getElementById(
    "transition-overlay",
  );

const colorSelector =
  document.getElementById(
    "color-selector",
  );

const paintingControls =
  document.getElementById(
    "painting-controls",
  );

const paintingDoneButton =
  document.getElementById(
    "painting-done-button",
  );

const sunflowerWheel =
  document.querySelector(
    ".sunflower-wheel",
  );

const petalColors = [
  0xff4500,
  0xdc143c,
  0xffd700,
  0x808000,
  0x87ceeb,
  0x008080,
  0x4b0082,
  0x800080,
  0xe6e6fa,
  0x4a3728,
  0x36454f,
  0xfff8dc,
];

const colorHex = [
  "#FF4500",
  "#DC143C",
  "#FFD700",
  "#808000",
  "#87CEEB",
  "#008080",
  "#4B0082",
  "#800080",
  "#E6E6FA",
  "#4A3728",
  "#36454F",
  "#FFF8DC",
];

// ============================================================
// PAINTING DONE
// ============================================================

if (paintingDoneButton) {
  paintingDoneButton.addEventListener(
    "click",
    () => {
      console.log(
        "Painting complete",
      );
    },
  );
}

// ============================================================
// COLOR SELECTOR
// ============================================================

if (sunflowerWheel) {
  petalColors.forEach(
    (color, index) => {
      const petal =
        document.createElement(
          "div",
        );

      petal.className =
        "petal";

      petal.style.backgroundColor =
        colorHex[index];

      petal.dataset.color =
        colorHex[index];

      const angle =
        (index /
          petalColors.length) *
        Math.PI *
        2;

      const radius = 70;

      const x =
        100 +
        Math.cos(angle) *
          radius -
        20;

      const y =
        100 +
        Math.sin(angle) *
          radius -
        30;

      petal.style.left =
        x + "px";

      petal.style.top =
        y + "px";

      petal.style.transform =
        `rotate(${angle + Math.PI / 2}rad)`;

      petal.addEventListener(
        "click",
        () => {
          document
            .querySelectorAll(
              ".petal",
            )
            .forEach((p) => {
              p.classList.remove(
                "selected",
              );
            });

          petal.classList.add(
            "selected",
          );

          selectedColor =
            colorHex[index];

          const center =
            document.querySelector(
              ".sunflower-center",
            );

          if (center) {
            center.style.background =
              `radial-gradient(
                circle,
                ${selectedColor} 0%,
                ${adjustColorBrightness(
                  selectedColor,
                  -20,
                )} 100%
              )`;
          }

          const preview =
            document.querySelector(
              ".color-preview",
            );

          if (preview) {
            preview.style.background =
              selectedColor;
          }
        },
      );

      sunflowerWheel.appendChild(
        petal,
      );
    },
  );
}

// ============================================================
// COLOR BRIGHTNESS
// ============================================================

function adjustColorBrightness(
  hex,
  percent,
) {
  const num =
    parseInt(
      hex.replace("#", ""),
      16,
    );

  const amt =
    Math.round(
      2.55 * percent,
    );

  const R =
    (num >> 16) + amt;

  const G =
    ((num >> 8) &
      0x00ff) +
    amt;

  const B =
    (num & 0x0000ff) +
    amt;

  return (
    "#" +
    (
      0x1000000 +
      (R < 255
        ? R < 1
          ? 0
          : R
        : 255) *
        0x10000 +
      (G < 255
        ? G < 1
          ? 0
          : G
        : 255) *
        0x100 +
      (B < 255
        ? B < 1
          ? 0
          : B
        : 255)
    )
      .toString(16)
      .slice(1)
  );
}

// ============================================================
// INITIAL COLOR PREVIEW
// ============================================================

const sunflowerCenter =
  document.querySelector(
    ".sunflower-center",
  );

if (sunflowerCenter) {
  sunflowerCenter.style.background =
    `radial-gradient(
      circle,
      ${selectedColor} 0%,
      #8B4513 100%
    )`;
}

// ============================================================
// MOUSE SCULPTING
// ============================================================

let dragging = false;

let lastX = 0;
let lastY = 0;

window.addEventListener(
  "pointerdown",
  (e) => {
    if (e.ctrlKey) {
      return;
    }

    if (
      currentRoom !==
      ROOM_STATE.SCULPT_ROOM
    ) {
      return;
    }

    dragging = true;

    lastX = e.clientX;
    lastY = e.clientY;
  },
);

window.addEventListener(
  "pointerup",
  () => {
    dragging = false;
  },
);

window.addEventListener(
  "pointercancel",
  () => {
    dragging = false;
  },
);

window.addEventListener(
  "pointermove",
  (e) => {
    mouse.x =
      (e.clientX /
        window.innerWidth) *
        2 -
      1;

    mouse.y =
      -(e.clientY /
        window.innerHeight) *
        2 +
      1;

    if (
      currentRoom !==
      ROOM_STATE.SCULPT_ROOM
    ) {
      return;
    }

    raycaster.setFromCamera(
      mouse,
      camera,
    );

    const hit =
      raycaster.intersectObject(
        pot,
      );

    if (hit.length) {
      sculptPoint =
        hit[0].point.clone();
    } else if (!dragging) {
      sculptPoint = null;
    }

    if (!dragging) {
      return;
    }

    const dx =
      (e.clientX - lastX) *
      0.003;

    let dy = 0;

    if (e.shiftKey) {
      dy =
        (lastY - e.clientY) *
        0.005;
    }

    lastX = e.clientX;
    lastY = e.clientY;

    targetRadiusChange +=
      dx *
      CLAY_RESISTANCE;

    if (e.shiftKey) {
      targetHeightChange +=
        dy *
        CLAY_RESISTANCE;
    }

    targetRadiusChange =
      THREE.MathUtils.clamp(
        targetRadiusChange,
        -MAX_FORCE,
        MAX_FORCE,
      );

    targetHeightChange =
      THREE.MathUtils.clamp(
        targetHeightChange,
        -MAX_FORCE,
        MAX_FORCE,
      );
  },
);

// ============================================================
// CLAY DEFORMATION
// ============================================================

function deformClay(
  radiusChange,
  heightChange,
) {
  if (!sculptPoint) {
    return;
  }

  const pos =
    geometry.attributes.position;

  for (
    let i = 0;
    i < pos.count;
    i++
  ) {
    const ox =
      clayPositions[
        i * 3
      ];

    const oy =
      clayPositions[
        i * 3 + 1
      ];

    const oz =
      clayPositions[
        i * 3 + 2
      ];

    const heightDistance =
      Math.abs(
        oy -
        sculptPoint.y,
      );

    if (
      heightDistance >
      BRUSH_HEIGHT
    ) {
      continue;
    }

    const brushStrength =
      1 -
      heightDistance /
        BRUSH_HEIGHT;

    const radius =
      Math.sqrt(
        ox * ox +
        oz * oz,
      );

    const angle =
      Math.atan2(
        oz,
        ox,
      );

    const deformation =
      THREE.MathUtils.clamp(
        radiusChange *
          brushStrength *
          3,
        -0.003,
        0.003,
      );

    const newRadius =
      radius *
      (1 + deformation);

    const heightScale =
      1 +
      heightChange *
        brushStrength *
        8;

    const newY =
      oy *
      heightScale;

    pos.setX(
      i,
      Math.cos(angle) *
        newRadius,
    );

    pos.setZ(
      i,
      Math.sin(angle) *
        newRadius,
    );

    pos.setY(
      i,
      THREE.MathUtils.clamp(
        newY,
        0,
        MAX_HEIGHT,
      ),
    );
  }

  pos.needsUpdate = true;

  for (
    let i = 0;
    i < pos.count * 3;
    i++
  ) {
    clayPositions[i] =
      pos.array[i];
  }

  geometry.computeVertexNormals();
}

// ============================================================
// GESTURE DETECTION
// ============================================================

function isOpenPalm(hand) {
  return (
    hand[8].y <
      hand[6].y &&
    hand[12].y <
      hand[10].y &&
    hand[16].y <
      hand[14].y &&
    hand[20].y <
      hand[18].y
  );
}

function isHeightGesture(
  hand,
) {
  const indexOpen =
    hand[8].y <
    hand[6].y;

  const middleOpen =
    hand[12].y <
    hand[10].y;

  const ringClosed =
    hand[16].y >
    hand[14].y;

  const pinkyClosed =
    hand[20].y >
    hand[18].y;

  return (
    indexOpen &&
    middleOpen &&
    ringClosed &&
    pinkyClosed
  );
}

function isPointingGesture(
  hand,
) {
  const indexOpen =
    hand[8].y <
    hand[6].y;

  const middleClosed =
    hand[12].y >
    hand[10].y;

  const ringClosed =
    hand[16].y >
    hand[14].y;

  const pinkyClosed =
    hand[20].y >
    hand[18].y;

  return (
    indexOpen &&
    middleClosed &&
    ringClosed &&
    pinkyClosed
  );
}

function getPinchStrength(
  hand,
) {
  const thumb =
    new THREE.Vector3(
      hand[4].x,
      hand[4].y,
      hand[4].z,
    );

  const index =
    new THREE.Vector3(
      hand[8].x,
      hand[8].y,
      hand[8].z,
    );

  const distance =
    thumb.distanceTo(
      index,
    );

  return THREE.MathUtils.clamp(
    THREE.MathUtils.mapLinear(
      distance,
      0.02,
      0.15,
      1,
      0,
    ),
    0,
    1,
  );
}

// ============================================================
// PAINT CLAY — HORIZONTAL RING
// ============================================================

function paintHorizontalRing(
  centerY,
) {
  if (
    currentRoom !==
    ROOM_STATE.PAINT_ROOM
  ) {
    return;
  }

  const colors =
    geometry.attributes.color;

  const positions =
    geometry.attributes.position;

  // Convert hand Y from MediaPipe
  // into clay height.
const clampedY =
  THREE.MathUtils.clamp(
    centerY,
    0,
    INITIAL_HEIGHT,
  );

  // ----------------------------------------------------------
  // Paint approximately 4 horizontal vertex rows
  // ----------------------------------------------------------

  for (
    let i = 0;
    i < positions.count;
    i++
  ) {
    const vertexY =
      positions.getY(i);

    const distance =
      Math.abs(
        vertexY -
        clampedY,
      );

    // Determine spacing between horizontal rows.
    const rowHeight =
      INITIAL_HEIGHT / 40;

    const brushHeight =
      rowHeight *
      PAINT_RING_WIDTH;

    if (
      distance >
      brushHeight
    ) {
      continue;
    }

    // Soft brush falloff
    const strength =
      1 -
      distance /
        brushHeight;

    const target =
      new THREE.Color(
        selectedColor,
      );

    const current =
      new THREE.Color();

    current.fromBufferAttribute(
      colors,
      i,
    );

    current.lerp(
      target,
      strength * 0.35,
    );

    colors.setXYZ(
      i,
      current.r,
      current.g,
      current.b,
    );
  }

  colors.needsUpdate = true;
}

function updatePaintHighlight(y) {
  const clampedY =
    THREE.MathUtils.clamp(
      y,
      0.1,
      INITIAL_HEIGHT - 0.1,
    );

  paintHighlight.position.set(
    0,
    clampedY,
    0,
  );
}


function paintHorizontalBand(centerY) {
  const pos =
    geometry.attributes.position;

  for (
    let i = 0;
    i < pos.count;
    i++
  ) {
    const y =
      pos.getY(i);

    const distance =
      Math.abs(
        y - centerY,
      );

    if (
      distance >
      PAINT_RADIUS
    ) {
      continue;
    }

    const strength =
      1 -
      distance /
        PAINT_RADIUS;

    // paint vertex here
  }

  pos.needsUpdate = true;
}
// ============================================================
// PAINTING HAND INPUT
// ============================================================

function updatePaintingHandInput(hand) {
  // ==========================================================
  // PAINT ROOM
  // ==========================================================

  finger.visible = true;

  const index = hand[8];

  const pinch =
    getPinchStrength(hand);

  const openPalm =
    isOpenPalm(hand);

  // ==========================================================
  // OPEN PALM → CAMERA CONTROL
  // ==========================================================

  if (
    openPalm &&
    pinch <= 0.5
  ) {
    updateGestureHUD(
      "Rotating Camera",
      "edit-3",
    );

    const palmY =
      (
        hand[0].y +
        hand[5].y +
        hand[9].y +
        hand[13].y +
        hand[17].y
      ) / 5;

    targetCameraAngle =
      THREE.MathUtils.mapLinear(
        palmY,
        0.2,
        0.8,
        -0.2,
        1.2,
      );
  }

  // ==========================================================
  // INDEX → RAYCAST TO POT
  // ==========================================================

  mouse.x =
    1 -
    index.x * 2;

  mouse.y =
    1 -
    index.y * 2;

  raycaster.setFromCamera(
    mouse,
    camera,
  );

  const hit =
    raycaster.intersectObject(
      pot,
    );

  if (!hit.length) {
    paintHighlight.visible = false;
    return;
  }

  // ==========================================================
  // ACTUAL 3D PAINT HEIGHT
  // ==========================================================

  const point =
    hit[0].point;

  const paintY =
    THREE.MathUtils.clamp(
      point.y,
      0,
      INITIAL_HEIGHT,
    );

  // ==========================================================
  // SHOW PAINT AREA
  // ==========================================================

  updatePaintHighlight(
    paintY,
  );

  paintHighlight.visible = true;

  // ==========================================================
  // PINCH → PAINT
  // ==========================================================

  if (
    pinch > 0.5 &&
    !openPalm
  ) {
    updateGestureHUD(
      "Painting",
      "paintbrush",
    );

    paintHorizontalRing(
      paintY,
    );
  }

    // ==========================================================
  // FINGER POINTER
  // ==========================================================

  updateFingerPointer(
    index,
  );
}


// ============================================================
// COMMON FINGER POINTER
// ============================================================

function updateFingerPointer(index) {
  mouse.x =
    1 -
    index.x * 2;

  mouse.y =
    1 -
    index.y * 2;

  raycaster.setFromCamera(
    mouse,
    camera,
  );

  const hit =
    raycaster.intersectObject(
      pot,
    );

  if (hit.length) {
    sculptPoint =
      hit[0].point.clone();

    const normal =
      hit[0].face.normal.clone();

    normal.transformDirection(
      pot.matrixWorld,
    );

    targetFinger.copy(
      hit[0].point,
    );

    targetFinger.addScaledVector(
      normal,
      0.03,
    );

    finger.visible = true;
  } else {
    sculptPoint = null;

    finger.visible = false;
  }
}

// ============================================================
// GESTURE INPUT
// ============================================================
function updateHandInput(hand) {
  // ==========================================================
  // PAINT ROOM
  // ==========================================================

  if (
    currentRoom ===
    ROOM_STATE.PAINT_ROOM
  ) {
    updatePaintingHandInput(hand);
    return;
  }

  // ==========================================================
  // SCULPT ROOM
  // ==========================================================

  const index = hand[8];

  const pinch =
    getPinchStrength(hand);

  const heightGesture =
    isHeightGesture(hand);

  const openPalm =
    isOpenPalm(hand);

  const pointing =
    isPointingGesture(hand);

  // ==========================================================
  // PINCH
  // ==========================================================

  if (pinch > 0.5) {
    updateGestureHUD(
      "Adjusting Radius",
      "minimize-2",
    );

    lastHeightY = null;

    if (!pinchActive) {
      pinchActive = true;
      pinchStartX = index.x;
    }

    const movement =
      index.x - pinchStartX;

    targetRadiusChange =
      movement *
      pinch *
      CLAY_RESISTANCE;

    targetRadiusChange =
      THREE.MathUtils.clamp(
        targetRadiusChange,
        -MAX_FORCE,
        MAX_FORCE,
      );
  } else {
    pinchActive = false;
  }

  // ==========================================================
  // HEIGHT
  // ==========================================================

  if (
    heightGesture &&
    pinch <= 0.5
  ) {
    updateGestureHUD(
      "Stretching Height",
      "maximize-2",
    );

    const middle = hand[12];

    if (lastHeightY !== null) {
      const movement =
        lastHeightY -
        middle.y;

      targetHeightChange +=
        movement *
        CLAY_RESISTANCE;

      targetHeightChange =
        THREE.MathUtils.clamp(
          targetHeightChange,
          -MAX_FORCE,
          MAX_FORCE,
        );
    }

    lastHeightY =
      middle.y;
  } else {
    lastHeightY = null;
  }

  // ==========================================================
  // OPEN PALM
  // ==========================================================

  if (
    openPalm &&
    pinch <= 0.5 &&
    !heightGesture
  ) {
    updateGestureHUD(
      "Rotating Camera",
      "edit-3",
    );

    const palmY =
      (
        hand[0].y +
        hand[5].y +
        hand[9].y +
        hand[13].y +
        hand[17].y
      ) / 5;

    targetCameraAngle =
      THREE.MathUtils.mapLinear(
        palmY,
        0.2,
        0.8,
        -0.2,
        1.2,
      );
  }

  // ==========================================================
  // POINTING
  // ==========================================================

  if (
    pointing &&
    pinch <= 0.5 &&
    !heightGesture &&
    !openPalm
  ) {
    updateGestureHUD(
      "Sculpting Point Active",
      "target",
    );
  }

  // ==========================================================
  // FINGER RAYCAST
  // ==========================================================

  mouse.x =
    1 -
    index.x * 2;

  mouse.y =
    1 -
    index.y * 2;

  raycaster.setFromCamera(
    mouse,
    camera,
  );

  const hit =
    raycaster.intersectObject(
      pot,
    );

  if (hit.length) {
    sculptPoint =
      hit[0].point.clone();

    const normal =
      hit[0].face.normal.clone();

    normal.transformDirection(
      pot.matrixWorld,
    );

    targetFinger.copy(
      hit[0].point,
    );

    targetFinger.addScaledVector(
      normal,
      0.03,
    );
  } else {
    sculptPoint = null;
  }
}

// ============================================================
// CLAY UPDATE
// ============================================================

function updateClay() {
  const radiusInput =
    Math.abs(
      targetRadiusChange,
    );

  const heightInput =
    Math.abs(
      targetHeightChange,
    );

  const inputStrength =
    THREE.MathUtils.clamp(
      (
        radiusInput +
        heightInput
      ) /
        (MAX_FORCE * 2),
      0,
      1,
    );

  if (
    radiusInput > 0 ||
    heightInput > 0
  ) {
    deformClay(
      targetRadiusChange,
      targetHeightChange,
    );

    updateSculptSound(
      inputStrength,
    );
  } else {
    stopSculptSound();
  }

  targetRadiusChange = 0;
  targetHeightChange = 0;
}

// ============================================================
// ANIMATION
// ============================================================

function animate() {
  requestAnimationFrame(
    animate,
  );

  const hand =
    detectHand(
      video,
      performance.now(),
    );

  if (hand) {
    // --------------------------------------------------------
    // DEBUG HAND
    // --------------------------------------------------------

    if (
      DEBUG &&
      debugCtx
    ) {
      debugCtx.clearRect(
        0,
        0,
        debugCanvas.width,
        debugCanvas.height,
      );

      debugCtx.strokeStyle =
        "lime";

      debugCtx.fillStyle =
        "red";

      debugCtx.lineWidth = 2;

      for (
        const p of hand
      ) {
        const x =
          (1 - p.x) *
          debugCanvas.width;

        const y =
          p.y *
          debugCanvas.height;

        debugCtx.beginPath();

        debugCtx.arc(
          x,
          y,
          4,
          0,
          Math.PI * 2,
        );

        debugCtx.fill();
      }

      debugCtx.strokeStyle =
        "cyan";

      for (
        const [a, b]
        of HAND_CONNECTIONS
      ) {
        debugCtx.beginPath();

        debugCtx.moveTo(
          (1 - hand[a].x) *
            debugCanvas.width,

          hand[a].y *
            debugCanvas.height,
        );

        debugCtx.lineTo(
          (1 - hand[b].x) *
            debugCanvas.width,

          hand[b].y *
            debugCanvas.height,
        );

        debugCtx.stroke();
      }
    }

    // --------------------------------------------------------
    // PROCESS HAND ONCE
    // --------------------------------------------------------

    updateHandInput(
      hand,
    );

    finger.position.lerp(
      targetFinger,
      0.2,
    );
  } else {
    lastHeightY = null;
    pinchActive = false;

    updateGestureHUD(
      "Waiting for hand gesture...",
      "activity",
    );

    stopSculptSound();
  }

  // ==========================================================
  // CAMERA
  // ==========================================================

  cameraAngle +=
    (
      targetCameraAngle -
      cameraAngle
    ) * 0.1;

  updateCamera();

  // ==========================================================
  // CLAY
  // ==========================================================

if (
  currentRoom ===
  ROOM_STATE.SCULPT_ROOM
) {
  updateClay();
}

  // ==========================================================
  // POTTERY WHEEL
  // ==========================================================

  if (
    currentRoom ===
    ROOM_STATE.SCULPT_ROOM
  ) {
    const time =
      performance.now() *
      0.001;

    const WHEEL_BASE_SPEED =
      0.5;

    const WHEEL_WAVE =
      Math.sin(
        time * 0.7,
      ) * 0.08;

    const WHEEL_SPEED =
      WHEEL_BASE_SPEED +
      WHEEL_WAVE;

    pot.rotation.y +=
      WHEEL_SPEED;

    updateWheelSound(
      WHEEL_SPEED /
        WHEEL_BASE_SPEED,
    );
  } else {
    updateWheelSound(0);
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  renderer.render(
    scene,
    camera,
  );
}

animate();

// ============================================================
// RESIZE
// ============================================================

window.addEventListener(
  "resize",
  () => {
    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight,
    );
  },
);