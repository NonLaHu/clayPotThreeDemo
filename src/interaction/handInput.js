import { ROOM_STATE } from "../core/constants.js";

import { updateSculptHandInput } from "../sculpt/sculptController.js";
import { updatePaintingHandInput } from "../paint/paintController.js";
import { updateDrawHandInput } from "../draw/drawController.js";

import { state } from "../core/state.js";
import { isThumbsUpGesture, getPinchStrength } from "./gestures.js";

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

  // Thumbs Up Detection for Done Button Timer
  // Disable thumbs up when:
  // 1. Pinch strength is not 0.00 (user is actively pinching)
  // 2. In paint room color selection mode
  const pinchStrength = getPinchStrength(hand);
  const shouldDetectThumbsUp = 
    pinchStrength < 0.01 && // Only when not pinching (with small threshold for noise)
    !(state.room === ROOM_STATE.PAINT_ROOM && state.paint.colorPickerActive); // And not in color selection
  
  if (shouldDetectThumbsUp) {
    const thumbsUpGesture = isThumbsUpGesture(hand);
    
    if (thumbsUpGesture && !state.thumbsUp.thumbsUpActive) {
      // Thumbs up detected - start timer
      state.thumbsUp.thumbsUpStartTime = performance.now();
      state.thumbsUp.thumbsUpActive = true;
    } else if (!thumbsUpGesture && state.thumbsUp.thumbsUpActive) {
      // Thumbs up released - reset timer
      state.thumbsUp.thumbsUpActive = false;
      state.thumbsUp.thumbsUpStartTime = null;
    }
  } else {
    // Reset thumbs up state when disabled (pinching or in color selection mode)
    if (state.thumbsUp.thumbsUpActive) {
      state.thumbsUp.thumbsUpActive = false;
      state.thumbsUp.thumbsUpStartTime = null;
    }
  }

  switch (state.room) {
    case ROOM_STATE.SCULPT_ROOM:
      updateSculptHandInput({
        hand,
        camera,
        pot,
        geometry,
        targetFinger,
        finger,
      });
      break;

    case ROOM_STATE.PAINT_ROOM:
      updatePaintingHandInput({
        hand,
        camera,
        pot,
        geometry,
        targetFinger,
        finger,
      });
      break;

    case ROOM_STATE.DRAW_ROOM:
      updateDrawHandInput({
        hand,
        camera,
        pot,
        targetFinger,
        finger,
      });
      break;

    default:
      console.warn(
        "Unknown room state:",
        state.room,
      );
  }
}