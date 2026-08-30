
import { ROOM_STATE } from "../core/constants.js";
import { state } from "../core/state.js";
import { updateGestureGuide } from "../UI/ui.js";
import {
  updateWheelSound,
  stopSculptSound,
} from "../sound.js";
import {
  updateStageUI
} from "../UI/ui.js";
import { paintHighlight } from "../scene/create.js";



// TRANSITION: SCULPT -> PAINT
export function transitionToPaintRoom() {
  if (state.room !== ROOM_STATE.SCULPT_ROOM) {
    return;
  }

  const transitionOverlay = document.getElementById("transition-overlay");

  const colorSelector = document.getElementById("color-selector");

  const paintingControls = document.getElementById("painting-controls");

  const paintingDoneButton = document.getElementById("painting-done-button");

  if (transitionOverlay) {
    transitionOverlay.classList.add("active");
  }

  setTimeout(() => {
    // Hide sculpt room
    state.rooms.sculptingEnvironmentGroup.visible = false;

    // Show paint room
    state.rooms.paintingEnvironmentGroup.visible = true;

    // Stop sculpting audio
    updateWheelSound(0);
    stopSculptSound();

    // Painting UI
    if (colorSelector) {
      colorSelector.classList.add("visible");
    }

    if (paintingControls) {
      paintingControls.classList.add("visible");
    }

    if (paintingDoneButton) {
      paintingDoneButton.classList.add("visible");
    }

    // Swap gesture guide to painting gestures
    updateGestureGuide(ROOM_STATE.PAINT_ROOM);

    // Change room
    state.room = ROOM_STATE.PAINT_ROOM;

    // Finish fade
    setTimeout(() => {
      if (transitionOverlay) {
        transitionOverlay.classList.remove("active");
      }
    }, 100);
  }, 500);
}

// TRANSITION: PAINT -> DRAW
export function transitionToDrawRoom() {
  if (state.room !== ROOM_STATE.PAINT_ROOM) {
    return;
  }

  updateStageUI();

  const transitionOverlay =
    document.getElementById("transition-overlay");

  const colorSelector =
    document.getElementById("color-selector");

  const paintingControls =
    document.getElementById("painting-controls");

  const paintingDoneButton =
    document.getElementById("painting-done-button");

  const drawControls =
    document.getElementById("draw-controls");

  const patternPanel =
    document.getElementById("pattern-panel");

  if (transitionOverlay) {
    transitionOverlay.classList.add("active");
  }

  setTimeout(() => {
    paintHighlight.visible = false;

    // Hide painting UI
    if (colorSelector) {
      colorSelector.classList.remove("visible");
    }

    if (paintingControls) {
      paintingControls.classList.remove("visible");
    }

    if (paintingDoneButton) {
      paintingDoneButton.classList.remove("visible");
    }

    // Show drawing UI
    if (drawControls) {
      drawControls.classList.add("visible");
    }

    // Show pattern panel
    if (patternPanel) {
      patternPanel.classList.add("visible");
    }

    // Change gesture guide
    updateGestureGuide(ROOM_STATE.DRAW_ROOM);

    // Change room
    state.room = ROOM_STATE.DRAW_ROOM;

    setTimeout(() => {
      if (transitionOverlay) {
        transitionOverlay.classList.remove("active");
      }
    }, 100);

  }, 500);
}