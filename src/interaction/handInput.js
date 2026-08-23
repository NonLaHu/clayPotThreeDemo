import { ROOM_STATE } from "../core/constants.js";

import { updateSculptHandInput } from "../sculpt/sculptController.js";
import { updatePaintingHandInput } from "../paint/paintController.js";
import { updateDrawHandInput } from "../draw/drawController.js";

import { state } from "../core/state.js";

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
        geometry,
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