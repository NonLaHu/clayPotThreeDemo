import { state } from "../core/state.js";
import { isOpenPalm, isHeightGesture, isPointingGesture, isSpiderManSign, getPinchStrength, getHandRotationDegrees } from "../interaction/gestures.js";
import { updateGestureHUD } from "../UI/ui.js";
import * as THREE from "three";
import {
  PAINT,
  COLOR,
  CLAY_POT,
  COLOR_COUNT,
  raycaster,
  mouse
} from "../core/constants.js";
import { paintHighlight } from "../scene/create.js";
import { adjustColorBrightness } from "../scene/functions.js";

function updateColorUI(color) {
  document.querySelectorAll(".petal").forEach((p) => {
    p.classList.remove("selected");
  });

  const petals = document.querySelectorAll(".petal");

  if (petals[state.paint.selectedColorIndex]) {
    petals[state.paint.selectedColorIndex].classList.add("selected");
  }

  const center = document.querySelector(".sunflower-center");

  if (center) {
    center.style.background = `radial-gradient(
        circle,
        ${color} 0%,
        ${adjustColorBrightness(color, -20)} 100%
      )`;
  }

  const preview = document.querySelector(".color-preview");

  if (preview) {
    preview.style.background = color;
  }
}
  
// ONLY USE 230 → 350°
function selectColorFromAngle(angle) {
  if (angle < 230 || angle > 350) {
    return;
  }
  const normalizedAngle = angle - 230;
  const sectorSize = 120 / COLOR_COUNT;
  let index = Math.floor(normalizedAngle / sectorSize);
  index = Math.min(index, COLOR_COUNT - 1);
  if (index === state.paint.selectedColorIndex) {
    return;
  }
  state.paint.selectedColorIndex = index;
  state.paint.selectedColor = COLOR[index];
  updateColorUI(state.paint.selectedColor);
}


// PAINT CLAY — HORIZONTAL RING
function paintHorizontalRing(centerY,geometry) {
  const colors = geometry.attributes.color;
  const positions = geometry.attributes.position;
  const clampedY = THREE.MathUtils.clamp(centerY, 0, CLAY_POT.INITIAL_HEIGHT);
  for (let i = 0; i < positions.count; i++) {
    const vertexY = positions.getY(i);
    const distance = Math.abs(vertexY - clampedY);
    const rowHeight = CLAY_POT.INITIAL_HEIGHT / 40;
    const brushHeight = rowHeight * PAINT.RING_WIDTH;
    if (distance > brushHeight) {
      continue;
    }
    const strength = 1 - distance / brushHeight;
    const target = new THREE.Color(state.paint.selectedColor);
    const current = new THREE.Color();
    current.fromBufferAttribute(colors, i);
    current.lerp(target, strength * 0.35);
    colors.setXYZ(i, current.r, current.g, current.b);
  }
  colors.needsUpdate = true;
}

function updateFingerPointer(index,camera,pot,targetFinger,finger) {
  mouse.x = 1 - index.x * 2;
  mouse.y = 1 - index.y * 2;
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObject(pot);
  if (hit.length) {
    state.sculpt.point = hit[0].point.clone();
    const normal = hit[0].face.normal.clone();
    normal.transformDirection(pot.matrixWorld);
    targetFinger.copy(hit[0].point);
    targetFinger.addScaledVector(normal, 0.03);
    finger.visible = true;
  } else {
    state.sculpt.point = null;
    finger.visible = false;
  }
}

function updatePaintHighlight(y) {
  const clampedY = THREE.MathUtils.clamp(y, 0.1, CLAY_POT.INITIAL_HEIGHT - 0.1);
  paintHighlight.position.set(0, clampedY, 0);
}

// PAINTING HAND INPUT
export function updatePaintingHandInput({
    hand,
    camera,
    pot,
    geometry,
    targetFinger,
    finger,
}) {
  // ==========================================================
  // PAINT ROOM
  // ==========================================================

  const index = hand[8];
  const pinch = getPinchStrength(hand);
  const openPalm = isOpenPalm(hand);
  const spiderSign = isSpiderManSign(hand);

  // ==========================================================
  // SPIDER-MAN SIGN → TOGGLE COLOR PICKER
  // ==========================================================

  if (spiderSign && !state.paint.lastSpiderSign) {
    state.paint.colorPickerActive = !state.paint.colorPickerActive;

    console.log(
      "Color picker:",
      state.paint.colorPickerActive ? "ON" : "OFF",
    );
  }

  state.paint.lastSpiderSign = spiderSign;

  // ==========================================================
  // COLOR PICKER MODE (PAUSES EVERYTHING ELSE)
  // ==========================================================

  if (state.paint.colorPickerActive) {
    const angle = getHandRotationDegrees(hand);
    state.paint.colorPickerAngle = angle;

    selectColorFromAngle(angle);

    updateGestureHUD(
      `Color Picker ${Math.round(angle)}°`,
      "palette",
    );

    // 1. Hide the painting indicators so they don't freeze on screen
    finger.visible = false;
    paintHighlight.visible = false;

    // 2. RETURN EARLY: This pauses camera rotation, raycasting, and painting!
    return; 
  }

  // ==========================================================
  // RESUME NORMAL PAINTING / CAMERA LOGIC
  // ==========================================================
  
  finger.visible = true; // Turn the finger back on

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
  // INDEX → RAYCAST TO POT
  // ==========================================================

  mouse.x = 1 - index.x * 2;
  mouse.y = 1 - index.y * 2;

  raycaster.setFromCamera(mouse, camera);

  const hit = raycaster.intersectObject(pot);

  if (!hit.length) {
    paintHighlight.visible = false;
    return;
  }

  // ==========================================================
  // ACTUAL 3D PAINT HEIGHT
  // ==========================================================

  const point = hit[0].point;
  const paintY = THREE.MathUtils.clamp(point.y, 0, CLAY_POT.INITIAL_HEIGHT);

  // ==========================================================
  // SHOW PAINT AREA
  // ==========================================================

  updatePaintHighlight(paintY);
  paintHighlight.visible = true;

  // ==========================================================
  // PINCH → PAINT
  // ==========================================================

  if (pinch > 0.5 && !openPalm) {
    updateGestureHUD("Painting", "paintbrush");
    paintHorizontalRing(paintY,geometry);
  }

  // ==========================================================
  // FINGER POINTER
  // ==========================================================

  updateFingerPointer(index,camera,pot,targetFinger,finger);
}