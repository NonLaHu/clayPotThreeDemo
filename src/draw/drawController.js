import * as THREE from "three";

import { state } from "../core/state.js";
import {
  raycaster,
  mouse,
  PATTERNS
} from "../core/constants.js";

import {
  isOpenPalm,
  isSpiderManSign,
  getPinchStrength,
  getHandRotationDegrees,
} from "../interaction/gestures.js";

import { updateGestureHUD } from "../UI/ui.js";

let paintCanvas = null;
let paintContext = null;
let paintTexture = null;

const PAINT_RESOLUTION = 2048;

let stampHighlight = null;
const STAMP_HEIGHT = 0.30;

let selectedPattern = null;
let patternTexture = null;

let patternCanvas = null;
let patternContext = null;
let patternImage = null;

let paintHistory = [];

const MAX_UNDO_STEPS = 20;

let patternPickerActive = false;
let lastSpiderSign = false;
let lastPinch = false;

function createStampHighlight(scene, pot) {
  if (stampHighlight) {
    return;
  }

  const geometry =
    new THREE.CylinderGeometry(
      1,
      1,
      1,
      96,
      1,
      true
    );

  const material =
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
    });

  stampHighlight =
    new THREE.Mesh(
      geometry,
      material
    );

  stampHighlight.visible = false;

  scene.add(
    stampHighlight
  );
}

function updateStampHighlight(
  hit,
  pot
) {
  if (!stampHighlight) {
    return;
  }

  // ----------------------------------------------------------
  // Pattern height
  // ----------------------------------------------------------

  const potBox =
    new THREE.Box3().setFromObject(
      pot
    );

  const potHeight =
    potBox.max.y -
    potBox.min.y;

  const stampHeight =
    STAMP_HEIGHT;

  // ----------------------------------------------------------
  // Vertical center from finger
  // ----------------------------------------------------------

  const centerY =
    hit.point.y;

  // ----------------------------------------------------------
  // Pot radius
  // ----------------------------------------------------------

  const center =
    potBox.getCenter(
      new THREE.Vector3()
    );

  const radius =
    Math.max(
      potBox.max.x - center.x,
      potBox.max.z - center.z
    );

  // ----------------------------------------------------------
  // Position
  // ----------------------------------------------------------

  stampHighlight.position.set(
    center.x,
    centerY,
    center.z
  );

  // ----------------------------------------------------------
  // Scale cylinder
  //
  // Geometry radius = 1
  // Geometry height = 1
  // ----------------------------------------------------------

  stampHighlight.scale.set(
    radius * 1.01,
    stampHeight,
    radius * 1.01
  );

  stampHighlight.visible = true;
}

function savePaintState() {
  if (!paintCanvas || !paintContext) {
    return;
  }

  const imageData =
    paintContext.getImageData(
      0,
      0,
      paintCanvas.width,
      paintCanvas.height
    );

  paintHistory.push(imageData);

  // Prevent unlimited memory usage
  if (
    paintHistory.length >
    MAX_UNDO_STEPS
  ) {
    paintHistory.shift();
  }
}

export function undoPaint() {
  if (
    paintHistory.length === 0
  ) {
    console.log(
      "Nothing to undo."
    );

    return;
  }

  const previousState =
    paintHistory.pop();

  paintContext.putImageData(
    previousState,
    0,
    0
  );

  paintTexture.needsUpdate = true;

  console.log(
    "Paint undone."
  );
}

//selector
function selectPatternFromAngle(angle) {
  if (angle < 230 || angle > 350) {
    return;
  }

  const normalizedAngle = angle - 230;

  const sectorSize =
    120 / PATTERNS.length;

  let index =
    Math.floor(
      normalizedAngle / sectorSize
    );

  index = Math.min(
    index,
    PATTERNS.length - 1
  );

  setSelectedPattern(index);
}
function createPaintTexture(pot) {
  if (paintCanvas) {
    return;
  }

  paintCanvas =
    document.createElement("canvas");

  paintCanvas.width =
    PAINT_RESOLUTION;

  paintCanvas.height =
    PAINT_RESOLUTION;

  paintContext =
    paintCanvas.getContext("2d");

  // ----------------------------------------------------------
  // Start with the pot's existing color
  // ----------------------------------------------------------

  const potColor =
    pot.material.color;

  const color =
    `#${potColor.getHexString()}`;

  paintContext.fillStyle = color;

  paintContext.fillRect(
    0,
    0,
    PAINT_RESOLUTION,
    PAINT_RESOLUTION
  );

  // ----------------------------------------------------------
  // Create texture
  // ----------------------------------------------------------

  paintTexture =
    new THREE.CanvasTexture(
      paintCanvas
    );

  paintTexture.colorSpace =
    THREE.SRGBColorSpace;

  paintTexture.wrapS =
    THREE.RepeatWrapping;

  paintTexture.wrapT =
    THREE.ClampToEdgeWrapping;

  paintTexture.minFilter =
    THREE.LinearMipmapLinearFilter;

  paintTexture.magFilter =
    THREE.LinearFilter;

  // ----------------------------------------------------------
  // Apply texture
  // ----------------------------------------------------------

  if (pot.material) {
    pot.material.map =
      paintTexture;

    pot.material.needsUpdate =
      true;
  }

  paintTexture.needsUpdate = true;
}

// ==========================================================
// PATTERN LOADING
// ==========================================================
function loadPattern(pattern) {
  if (!pattern) {
    return;
  }

  const loader = new THREE.TextureLoader();

  loader.load(
    pattern.src,
    (texture) => {
      patternTexture = texture;

      texture.colorSpace = THREE.SRGBColorSpace;

      // Load PNG pixels for stamping
      const image = texture.image;

      patternCanvas = document.createElement("canvas");
      patternCanvas.width = image.width;
      patternCanvas.height = image.height;

      patternContext =
        patternCanvas.getContext("2d");

      patternContext.clearRect(
        0,
        0,
        image.width,
        image.height,
      );

      patternContext.drawImage(
        image,
        0,
        0,
      );

      patternImage = patternContext.getImageData(
        0,
        0,
        image.width,
        image.height,
      );

      console.log(
        `Pattern loaded: ${pattern.id}`,
      );
    },
    undefined,
    (error) => {
      console.error(
        `Failed to load pattern: ${pattern.src}`,
        error,
      );
    },
  );
}

//select
function setSelectedPattern(index) {
  if (
    index < 0 ||
    index >= PATTERNS.length
  ) {
    return;
  }

  state.draw.selectedPatternIndex = index;

  selectedPattern = PATTERNS[index];

  loadPattern(selectedPattern);

  updatePatternUI(index);

  console.log(
    "Selected pattern:",
    selectedPattern.id,
  );
}

// pattern ui
function updatePatternUI(index) {
  document
    .querySelectorAll(".pattern-petal")
    .forEach((petal) => {
      petal.classList.remove("selected");
    });

  const petals =
    document.querySelectorAll(".pattern-petal");

  if (petals[index]) {
    petals[index].classList.add("selected");
  }
}


// ==========================================================
// STAMP
// ==========================================================
function stampPattern(hit,pot) {
  if (
    !selectedPattern ||
    !patternTexture ||
    !paintContext ||
    !paintTexture
  ) {
    return;
  }

  if (!hit.uv) {
    console.warn(
      "Pot geometry does not have UV coordinates."
    );
    return;
  }

  const canvasWidth =
    paintCanvas.width;

  const canvasHeight =
    paintCanvas.height;

  // ----------------------------------------------------------
  // PATTERN HEIGHT
  //
  // This is now controlled by STAMP_HEIGHT_RATIO.
  //
  // Example:
  // 0.10 = 10% of pot height
  // 0.20 = 20%
  // 0.30 = 30%
  // ----------------------------------------------------------

  const potBox =
    new THREE.Box3().setFromObject(
      pot
    );

  const potHeight =
    potBox.max.y -
    potBox.min.y;

  const patternHeight =
    Math.floor(
      canvasHeight *
      (STAMP_HEIGHT / potHeight)
    );

  // ----------------------------------------------------------
  // Finger's vertical UV position
  // ----------------------------------------------------------

  const centerY =
    (1 - hit.uv.y) *
    canvasHeight;

  const patternY =
    centerY -
    patternHeight / 2;

  // ----------------------------------------------------------
  // Pattern image
  // ----------------------------------------------------------

  const image =
    patternTexture.image;

  if (!image) {
    return;
  }

  // ----------------------------------------------------------
  // Save before modifying canvas
  // ----------------------------------------------------------

  savePaintState();

  // ----------------------------------------------------------
  // Stamp
  //
  // Full width = entire circumference
  // Height = STAMP_HEIGHT_RATIO
  // ----------------------------------------------------------

  paintContext.drawImage(
    image,

    0,
    0,
    image.width,
    image.height,

    0,
    patternY,
    canvasWidth,
    patternHeight
  );

  paintTexture.needsUpdate = true;

  console.log(
    "STAMP HEIGHT:",
    STAMP_HEIGHT
  );
}


export function initDraw(
  scene,
  pot
) {
  createStampHighlight(
    scene,
    pot
  );

  createPaintTexture(
    pot
  );

  selectedPattern =
    PATTERNS[0];

  state.draw.selectedPatternIndex =
    0;

  loadPattern(
    selectedPattern
  );

  updatePatternUI(0);
}


// ==========================================================
// PATTERN SELECTION
// ==========================================================

export function selectPattern(index, scene) {
  if (
    index < 0 ||
    index >= PATTERNS.length
  ) {
    return;
  }

  setSelectedPattern(index);

}


// ==========================================================
// DRAW ROOM HAND INPUT
// ==========================================================
export function updateDrawHandInput({
  hand,
  camera,
  pot,
  geometry,
  targetFinger,
  finger,
}) {
  const index = hand[8];

  const pinch =
    getPinchStrength(hand);

  const openPalm =
    isOpenPalm(hand);

  const spiderSign =
    isSpiderManSign(hand);


  // ==========================================================
  // SPIDER-MAN SIGN → TOGGLE PATTERN PICKER
  // ==========================================================

  if (
    spiderSign &&
    !lastSpiderSign
  ) {
    patternPickerActive =
      !patternPickerActive;

    state.draw.patternPickerActive =
      patternPickerActive;

    console.log(
      "Pattern picker:",
      patternPickerActive
        ? "ON"
        : "OFF"
    );
  }

  lastSpiderSign =
    spiderSign;


  // ==========================================================
  // PATTERN PICKER MODE
  // ==========================================================

  if (patternPickerActive) {
    lastPinch = false;

    const angle =
      getHandRotationDegrees(hand);

    state.draw.patternPickerAngle =
      angle;

    selectPatternFromAngle(angle);

    updateGestureHUD(
      `Pattern Picker ${Math.round(angle)}°`,
      "palette",
    );


    finger.visible = false;

    return;
  }


  // ==========================================================
  // NORMAL DRAW MODE
  // ==========================================================

  // OPEN PALM → CAMERA
  if (
    openPalm &&
    pinch <= 0.5
  ) {
    updateGestureHUD(
      "Rotating Camera",
      "edit-3",
    );

    const palmX =
    (
        hand[0].x +
        hand[5].x +
        hand[9].x +
        hand[13].x +
        hand[17].x
    ) / 5;

    const palmY =
    (
        hand[0].y +
        hand[5].y +
        hand[9].y +
        hand[13].y +
        hand[17].y
    ) / 5;

    state.camera.targetAngle =
    THREE.MathUtils.mapLinear(
        palmX,
        0.15,
        0.85,
        -Math.PI,
        Math.PI,
    );

    state.camera.targetVerticalAngle =
    THREE.MathUtils.mapLinear(
        palmY,
        0.15,
        0.85,
        0.8,
        -0.5,
    );

    state.camera.targetVerticalAngle =
  THREE.MathUtils.clamp(
    state.camera.targetVerticalAngle,
    state.camera.minVerticalAngle,
    state.camera.maxVerticalAngle,
  );

    



    return;
  }


  // ==========================================================
  // INDEX → POT
  // ==========================================================

  mouse.x =
    1 - index.x * 2;

  mouse.y =
    1 - index.y * 2;

  raycaster.setFromCamera(
    mouse,
    camera,
  );

  const hits =
    raycaster.intersectObject(
      pot
    );
  
  if (!hits.length) {
  if (stampHighlight) {
    stampHighlight.visible = false;
  }

  finger.visible = false;
  lastPinch = false;

  return;
}


  // ==========================================================
  // HIT
  // ==========================================================

  const hit = hits[0];


  updateStampHighlight(
    hit,
    pot
  );


  // ==========================================================
  // PINCH → STAMP
  // ==========================================================

    const pinchActive = pinch > 0.5;

    if (pinchActive && !lastPinch) {
    updateGestureHUD(
        "Pattern Stamped",
        "check",
    );

    stampPattern(
        hit, pot
    );
    }

    lastPinch = pinchActive;
}