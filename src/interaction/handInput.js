// interaction/handInput.js

import { ROOM_STATE } from "../core/constants.js";
import { updateSculptHandInput } from "../sculpt/sculptController.js";
import { updatePaintingHandInput } from "../paint/paintController.js";
import { state } from "../core/state.js";
import {
  isOpenPalm,
  isHeightGesture,
  isPointingGesture,
  isSpiderManSign,
  getPinchStrength,
  getHandRotationDegrees,
} from "../interaction/gestures.js";

export function updateHandInput({
  hand,
  camera,
  pot,
  geometry,
  targetFinger,
  finger,
}) {
  if (!Array.isArray(hand) || hand.length < 21) {
    return;
  }
  if (state.room === ROOM_STATE.PAINT_ROOM) {
    updatePaintingHandInput({
      hand,
      camera,
      pot,
      geometry,
      targetFinger,
      finger,
    });

    return;
  }

  updateSculptHandInput({
    hand,
    camera,
    pot,
    geometry,
    targetFinger,
    finger,
  });
}
