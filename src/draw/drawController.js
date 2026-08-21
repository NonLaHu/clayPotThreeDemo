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

let selectedPattern = null;
let patternPreview = null;
let patternTexture = null;

let patternCanvas = null;
let patternContext = null;
let patternImage = null;

let patternPickerActive = false;
let lastSpiderSign = false;
let lastPinch = false;

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

      if (patternPreview) {
        patternPreview.material.map = texture;
        patternPreview.material.needsUpdate = true;
      }

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
// CREATE PREVIEW
// ==========================================================

function createPatternPreview(scene) {
  if (patternPreview) {
    return;
  }

  const material =
    new THREE.SpriteMaterial({
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

  patternPreview =
    new THREE.Sprite(material);

  patternPreview.scale.set(
    0.6,
    0.6,
    0.6,
  );

  patternPreview.visible = false;

  scene.add(patternPreview);
}


// ==========================================================
// SHOW PREVIEW
// ==========================================================

function showPatternPreview(
  point,
  normal,
) {
  if (!patternPreview || !patternTexture) {
    return;
  }

  patternPreview.position.copy(point);

  // Move slightly away from the pot
  // to prevent z-fighting.
  patternPreview.position.addScaledVector(
    normal,
    0.01,
  );

  patternPreview.visible = true;
}


// ==========================================================
// HIDE PREVIEW
// ==========================================================

function hidePatternPreview() {
  if (!patternPreview) {
    return;
  }

  patternPreview.visible = false;
}


// ==========================================================
// STAMP
// ==========================================================
function stampPattern(hit, geometry) {
    
  if (!selectedPattern || !patternImage) {
    return;
  }

  const colors =
    geometry.attributes.color;

  const positions =
    geometry.attributes.position;

  const imageWidth =
    patternImage.width;

  const imageHeight =
    patternImage.height;

  const pixels =
    patternImage.data;

  const center =
    hit.point.clone();

  const radius = 0.35;

  const targetColor =
    new THREE.Color(
      state.paint.selectedColor
    );

  for (let i = 0; i < positions.count; i++) {
    const vertex =
      new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i),
      );

    const distance =
      vertex.distanceTo(center);

    if (distance > radius) {
      continue;
    }

    // Normalize vertex position inside stamp
    const dx =
      (vertex.x - center.x) / radius;

    const dy =
      (vertex.y - center.y) / radius;

    const u =
      (dx + 1) * 0.5;

    const v =
      (dy + 1) * 0.5;

    if (
      u < 0 ||
      u > 1 ||
      v < 0 ||
      v > 1
    ) {
      continue;
    }

    const px =
      Math.floor(
        u * (imageWidth - 1)
      );

    const py =
      Math.floor(
        (1 - v) *
        (imageHeight - 1)
      );

    const pixelIndex =
      (py * imageWidth + px) * 4;

    const alpha =
      pixels[pixelIndex + 3] / 255;

    if (alpha <= 0) {
      continue;
    }

    const current =
      new THREE.Color()
        .fromBufferAttribute(
          colors,
          i,
        );

    current.lerp(
      targetColor,
      alpha,
    );

    colors.setXYZ(
      i,
      current.r,
      current.g,
      current.b,
    );
  }

  colors.needsUpdate = true;

  console.log(
    "STAMP:",
    selectedPattern.id,
  );
}

// init drawing
export function initDraw(scene) {
  createPatternPreview(scene);

  // Select first pattern
  selectedPattern =
    PATTERNS[0];

  state.draw.selectedPatternIndex = 0;

  loadPattern(selectedPattern);

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

  createPatternPreview(scene);
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

    hidePatternPreview();

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

    

    hidePatternPreview();

    finger.visible = false;

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


  // ==========================================================
  // MISS
  // ==========================================================

    if (!hits.length) {
    hidePatternPreview();
    finger.visible = false;
    lastPinch = false;
    return;
    }


  // ==========================================================
  // HIT
  // ==========================================================

  const hit = hits[0];

  finger.visible = true;

  targetFinger.copy(
    hit.point
  );


  // ==========================================================
  // SHOW PATTERN
  // ==========================================================

  if (selectedPattern) {
    showPatternPreview(
      hit.point,
      hit.face.normal,
    );
  }


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
        hit,
        geometry,
    );
    }

    lastPinch = pinchActive;
}