import * as THREE from "three";
import "./style.css";

import { setupEnvironment } from "./environment.js";
import { initHand, detectHand } from "./hand.js";
import { initUI, updateGestureHUD } from "./UI/ui.js";
import { initSound, resumeSound, setSoundEnabled, updateWheelSound, updateSculptSound, stopSculptSound} from "./sound.js";
const DEBUG = true;

// =====================
// Debug Camera Video
// =====================

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

// =====================
// Hand Connections
// =====================

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

// =====================
// Debug Canvas
// =====================

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

// =====================
// Gesture State
// =====================

let lastHeightY = null;
let pinchActive = false;
let pinchStartX = 0;

// =====================
// Camera
// =====================

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: 640,
      height: 480,
    },
  });

  video.srcObject = stream;

  await video.play();

  console.log("camera ready");
}

// =====================
// Scene
// =====================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x111111);

const environment = setupEnvironment(scene);

// =====================
// Camera
// =====================

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);

camera.position.set(3, 2.5, 5);
camera.lookAt(0, 1, 0);

// =====================
// Sculpt Settings
// =====================

const BRUSH_HEIGHT = 0.25;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let sculptPoint = null;

let targetRadiusChange = 0;
let targetHeightChange = 0;

const CLAY_RESISTANCE = 0.05;
const MAX_FORCE = 0.005;

// =====================
// Renderer
// =====================

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
});

renderer.setSize(
  window.innerWidth,
  window.innerHeight,
);

document.body.appendChild(renderer.domElement);

// =====================
// Camera Vertical Control
// =====================

let cameraAngle = 0.45;

function updateCamera() {
  const radius = 5;

  camera.position.y =
    2 +
    Math.sin(cameraAngle) * radius;

  camera.position.z =
    Math.cos(cameraAngle) * radius;

  camera.lookAt(0, 1, 0);
}

let targetCameraAngle = cameraAngle;

// =====================
// Clay Pot Geometry
// =====================

const points = [];

const MAX_HEIGHT = 4;
const INITIAL_HEIGHT = 2;
const segments = 64;

const thickness = 0.05;

// =====================
// Outer Wall
// =====================

for (let i = 0; i <= 40; i++) {
  const y = (i / 40) * INITIAL_HEIGHT;

  let radius;

  if (y < 0.2) {
    radius = 0.8;
  } else if (y < 1.2) {
    radius = 0.55 + y * 0.15;
  } else {
    radius = 0.75 - (y - 1.2) * 0.25;
  }

  points.push(
    new THREE.Vector2(radius, y),
  );
}

// =====================
// Inner Wall
// =====================

for (let i = 40; i >= 0; i--) {
  const y = (i / 40) * INITIAL_HEIGHT;

  let radius;

  if (y < 0.2) {
    radius = 0.8;
  } else if (y < 1.2) {
    radius = 0.55 + y * 0.15;
  } else {
    radius = 0.75 - (y - 1.2) * 0.25;
  }

  points.push(
    new THREE.Vector2(
      radius - thickness,
      y,
    ),
  );
}

points.push(
  new THREE.Vector2(0, 0.08),
);

const geometry = new THREE.LatheGeometry(
  points,
  segments,
);

const material = new THREE.MeshStandardMaterial({
  color: 0xb56535,
  roughness: 0.92,
  metalness: 0,
  side: THREE.DoubleSide,
});

const pot = new THREE.Mesh(
  geometry,
  material,
);

scene.add(pot);
initSound();
// =====================
// Clay State
// =====================

// Original geometry for reset
const initialClayPositions =
  geometry.attributes.position.array.slice();

// Mutable geometry state
const clayPositions =
  geometry.attributes.position.array.slice();

// =====================
// UI
// =====================

initUI({
  onReset: () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset your pottery progress?",
    );

    if (!confirmed) {
      return;
    }

    const pos = geometry.attributes.position;

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

  onExport: () => {
    renderer.render(scene, camera);

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

  onSoundToggle: async (enabled) => {
    if (!enabled) {
      // Explicitly disable
      setSoundEnabled(false);
      return;
    }

    // Explicitly enable
    const state =
      await resumeSound();

    if (state !== "running") {
      throw new Error(
        "Audio could not be started.",
      );
    }

    setSoundEnabled(true);
  },
});

// =====================
// Ground
// =====================

const ground = new THREE.Mesh(
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

ground.position.y = -0.05;

scene.add(ground);

// =====================
// Lights
// =====================

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

light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;

light.shadow.camera.near = 0.5;
light.shadow.camera.far = 50;

scene.add(light);

// =====================
// Finger Indicator
// =====================

const targetFinger =
  new THREE.Vector3();

const finger = new THREE.Mesh(
  new THREE.SphereGeometry(0.05),

  new THREE.MeshBasicMaterial({
    color: 0xff0000,
  }),
);

scene.add(finger);

// =====================
// Hand & Sound Setup
// =====================

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

// =====================
// Mouse Sculpting
// =====================

let dragging = false;

let lastX = 0;
let lastY = 0;

window.addEventListener(
  "pointerdown",
  (e) => {
    if (e.ctrlKey) {
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
      (e.clientX / window.innerWidth) *
        2 -
      1;

    mouse.y =
      -(e.clientY / window.innerHeight) *
        2 +
      1;

    raycaster.setFromCamera(
      mouse,
      camera,
    );

    const hit =
      raycaster.intersectObject(pot);

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
      (e.clientX - lastX) * 0.003;

    let dy = 0;

    if (e.shiftKey) {
      dy =
        (lastY - e.clientY) *
        0.005;
    }

    lastX = e.clientX;
    lastY = e.clientY;

    targetRadiusChange +=
      dx * CLAY_RESISTANCE;

    if (e.shiftKey) {
      targetHeightChange +=
        dy * CLAY_RESISTANCE;
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

// =====================
// Clay Deformation
// =====================

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
      clayPositions[i * 3];

    const oy =
      clayPositions[i * 3 + 1];

    const oz =
      clayPositions[i * 3 + 2];

    const heightDistance =
      Math.abs(
        oy - sculptPoint.y,
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
      oy * heightScale;

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

  // Save current geometry state
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

// =====================
// Gesture Detection
// =====================

function isOpenPalm(hand) {
  return (
    hand[8].y < hand[6].y &&
    hand[12].y < hand[10].y &&
    hand[16].y < hand[14].y &&
    hand[20].y < hand[18].y
  );
}

function isHeightGesture(hand) {
  const indexOpen =
    hand[8].y < hand[6].y;

  const middleOpen =
    hand[12].y < hand[10].y;

  const ringClosed =
    hand[16].y > hand[14].y;

  const pinkyClosed =
    hand[20].y > hand[18].y;

  return (
    indexOpen &&
    middleOpen &&
    ringClosed &&
    pinkyClosed
  );
}

function isPointingGesture(hand) {
  const indexOpen =
    hand[8].y < hand[6].y;

  const middleClosed =
    hand[12].y > hand[10].y;

  const ringClosed =
    hand[16].y > hand[14].y;

  const pinkyClosed =
    hand[20].y > hand[18].y;

  return (
    indexOpen &&
    middleClosed &&
    ringClosed &&
    pinkyClosed
  );
}

function getPinchStrength(hand) {
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
    thumb.distanceTo(index);

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

// =====================
// Gesture Input
// =====================

function updateHandInput(hand) {
  const index = hand[8];

  const pinch =
    getPinchStrength(hand);

  const heightGesture =
    isHeightGesture(hand);

  const openPalm =
    isOpenPalm(hand);

  const pointing =
    isPointingGesture(hand);

  // =====================
  // 1. Pinch
  // Radius Control
  // =====================

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

  // =====================
  // 2. Height
  // Two Fingers
  // =====================

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

    lastHeightY = middle.y;
  } else {
    lastHeightY = null;
  }

  // =====================
  // 3. Open Palm
  // Camera Control
  // =====================

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

  // =====================
  // 4. Pointing
  // Sculpting
  // =====================

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

  // =====================
  // Finger Raycast
  // =====================

  mouse.x =
    1 - index.x * 2;

  mouse.y =
    1 - index.y * 2;

  raycaster.setFromCamera(
    mouse,
    camera,
  );

  const hit =
    raycaster.intersectObject(pot);

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

// =====================
// Clay Update
// =====================

function updateClay() {
  const radiusInput =
    Math.abs(targetRadiusChange);

  const heightInput =
    Math.abs(targetHeightChange);

  const inputStrength =
    THREE.MathUtils.clamp(
      (radiusInput + heightInput) /
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

  // Consume input
  targetRadiusChange = 0;
  targetHeightChange = 0;
}
// =====================
// Animation
// =====================
function animate() {
  requestAnimationFrame(animate);

  const hand =
    detectHand(
      video,
      performance.now(),
    );

  if (hand) {
    // =====================
    // Debug Hand
    // =====================

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

      // Landmarks
      for (const p of hand) {
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

      // Connections
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

    // =====================
    // Process Hand ONCE
    // =====================

    updateHandInput(hand);

    // =====================
    // Finger Indicator
    // =====================

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

  // =====================
  // Camera
  // =====================

  cameraAngle +=
    (
      targetCameraAngle -
      cameraAngle
    ) * 0.1;

  updateCamera();

  // =====================
  // Clay
  // =====================

  updateClay();

const time =
  performance.now() * 0.001;

const WHEEL_BASE_SPEED = 0.5;

const WHEEL_WAVE =
  Math.sin(time * 0.7) * 0.08;

const WHEEL_SPEED =
  WHEEL_BASE_SPEED +
  WHEEL_WAVE ;

pot.rotation.y +=
  WHEEL_SPEED;

updateWheelSound(
  WHEEL_SPEED /
    WHEEL_BASE_SPEED,
);

  // =====================
  // Render
  // =====================

  renderer.render(
    scene,
    camera,
  );
}

animate();

// =====================
// Resize
// =====================

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