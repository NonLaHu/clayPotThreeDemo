import { state } from "../core/state.js";
import { isOpenPalm, isHeightGesture, isPointingGesture, isSpiderManSign, getPinchStrength, getHandRotationDegrees } from "../interaction/gestures.js";
import { updateGestureHUD } from "../UI/ui.js";
import * as THREE from "three";
import {
  SCULPT,
  raycaster,
  mouse
} from "../core/constants.js";

export function updateSculptHandInput({  
    hand,
    camera,
    pot,
    geometry,
    targetFinger,
    finger,
}) {

  const index = hand[8];
  const pinch = getPinchStrength(hand);
  const heightGesture = isHeightGesture(hand);
  const openPalm = isOpenPalm(hand);
  const pointing = isPointingGesture(hand);

  // PINCH
  if (pinch > 0.5) {
    updateGestureHUD("Adjusting Radius", "minimize-2");

    state.sculpt.lastHeightY = null;

    if (!state.sculpt.pinchActive) {
      state.sculpt.pinchActive = true;
      state.sculpt.pinchStartX = index.x;
    }

    const movement = index.x - state.sculpt.pinchStartX;

    state.sculpt.targetRadiusChange = movement * pinch * SCULPT.CLAY_RESISTANCE;

    state.sculpt.targetRadiusChange = THREE.MathUtils.clamp(
      state.sculpt.targetRadiusChange,
      -SCULPT.MAX_FORCE,
      SCULPT.MAX_FORCE,
    );
  } else {
    state.sculpt.pinchActive = false;
  }

  // HEIGHT
  if (heightGesture && pinch <= 0.5) {
    updateGestureHUD("Stretching Height", "maximize-2");

    const middle = hand[12];

    if (state.sculpt.lastHeightY !== null) {
      const movement = state.sculpt.lastHeightY - middle.y;

      state.sculpt.targetHeightChange += movement * SCULPT.CLAY_RESISTANCE;

      state.sculpt.targetHeightChange = THREE.MathUtils.clamp(
        state.sculpt.targetHeightChange,
        -SCULPT.MAX_FORCE,
        SCULPT.MAX_FORCE,
      );
    }

    state.sculpt.lastHeightY = middle.y;
  } else {
    state.sculpt.lastHeightY = null;
  }

  // OPEN PALM
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
    Math.PI,
    -Math.PI,
  );

state.camera.targetVerticalAngle =
  THREE.MathUtils.mapLinear(
    palmY,
    0.15,
    0.85,
    -0.5,
    0.8,
  );

  state.camera.targetVerticalAngle =
  THREE.MathUtils.clamp(
    state.camera.targetVerticalAngle,
    state.camera.minVerticalAngle,
    state.camera.maxVerticalAngle,
  );



    return;
  }


  // POINTING
  if (pointing && pinch <= 0.5 && !heightGesture && !openPalm) {
    updateGestureHUD("Sculpting Point Active", "target");
  }

  // FINGER RAYCAST
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
  } else {
    state.sculpt.point = null;
  }
}
