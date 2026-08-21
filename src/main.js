import * as THREE from "three";
import "./style.css";

import { setupEnvironment } from "./environment.js";
import { setupPaintingEnvironment } from "./paintingEnvironment.js";
import { initHand, detectHand } from "./hand.js";

import {
  initDebug,
  getDebugVideo,
  drawHand,
} from "./debug/debug.js";
import { state } from "./core/state.js";
import {
  ROOM_STATE,
  PAINT,
  COLOR,
  CLAY_POT,
  SCULPT,
  COLOR_COUNT,
  raycaster,
  mouse
} from "./core/constants.js";

import { transitionToPaintRoom } from "./rooms/roomcontroller.js"
import { create, ground, paintHighlight, targetFinger, finger, light } from "./scene/create.js";
import { adjustColorBrightness } from "./scene/functions.js";
import { deformClay } from "./sculpt/clayDeformer.js";

import { updateHandInput } from "./interaction/handInput.js";
import { initUI, updateGestureHUD, updateGestureGuide } from "./UI/ui.js";

import { createSaveFlow } from "./save/saveFlow.js";
import { restorePotFromSave } from "./save/restorePot.js";

import {
  initSound,
  resumeSound,
  setSoundEnabled,
  updateWheelSound,
  updateSculptSound,
  stopSculptSound,
} from "./sound.js";

const DEBUG = true;

// inital status-----------------
paintHighlight.userData.hideInPoster = true;
paintHighlight.visible = false;

finger.userData.hideInPoster = true;

light.position.set(3, 5, 3);
light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 50;

//LOADING
const loadingScreen = document.getElementById("loading-screen");
const loadingStatus = document.getElementById("loading-status");

function setLoadingStatus(message) {
  if (loadingStatus) {
    loadingStatus.textContent = message;
  }
}

function hideLoadingScreen() {
  loadingScreen?.classList.add("hidden");
}

// CAMERA / WEBCAM
async function startCamera() {
  const video = getDebugVideo();
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

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// SCULPTING ENVIRONMENT
state.rooms.sculptingEnvironmentGroup = new THREE.Group();
setupEnvironment(state.rooms.sculptingEnvironmentGroup);
scene.add(state.rooms.sculptingEnvironmentGroup);

// PAINTING ENVIRONMENT
state.rooms.paintingEnvironmentGroup = new THREE.Group();
setupPaintingEnvironment(state.rooms.paintingEnvironmentGroup);
state.rooms.paintingEnvironmentGroup.visible = false;
scene.add(state.rooms.paintingEnvironmentGroup);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);

camera.position.set(3, 2.5, 5);
camera.lookAt(0, 1, 0);



// RENDERER
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function updateCamera() {
  const radius = 5;
  camera.position.y = 2 + Math.sin(state.camera.angle) * radius;
  camera.position.z = Math.cos(state.camera.angle) * radius;
  camera.lookAt(0, 1, 0);
}

// clay pot creation
const { pot, geometry } = create();
scene.add(pot);
scene.add(ground);
scene.add(paintHighlight);
scene.add(finger);
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));
scene.add(light);

// CLAY
const initialClayPositions = geometry.attributes.position.array.slice();
const clayPositions = geometry.attributes.position.array.slice();

// UI
const saveFlow = createSaveFlow({
  renderer,
  scene,
  camera,
  geometry,
  getCameraAngle: () => state.camera.angle,
  onRestore: (save) => {
    restorePotFromSave(save, geometry);

    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count * 3; i++) {
      clayPositions[i] = pos.array[i];
    }

    updateGestureHUD("Save loaded", "check");
  },
});

initUI({
  // RESET
  onReset: () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset your pottery progress?",
    );

    if (!confirmed) {
      return;
    }

    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count * 3; i++) {
      pos.array[i] = initialClayPositions[i];

      clayPositions[i] = initialClayPositions[i];
    }

    pos.needsUpdate = true;

    geometry.computeVertexNormals();
  },

  // EXPORT
  onExport: async () => {
    saveFlow.exportCurrentWork().catch((error) => {
      console.error("Save export failed:", error);

      const detail = error && error.message ? ` (${error.message})` : "";
      window.alert(
        `Could not save / export your pot. Please try again.${detail}`,
      );
    });
  },

  // LOAD PROGRESS
  onLoad: () => {
    saveFlow.loadByCode().catch((error) => {
      console.error("Load progress failed:", error);
    });
  },

  // SOUND
  onSoundToggle: async (enabled) => {
    if (!enabled) {
      setSoundEnabled(false);
      return;
    }

    const state = await resumeSound();

    if (state !== "running") {
      throw new Error("Audio could not be started.");
    }

    setSoundEnabled(true);
  },

  // DONE
  onDone: () => {
    transitionToPaintRoom();
  },
});

// HAND SETUP
async function setup() {
  try {
    setLoadingStatus("Starting camera...");
    await startCamera();

    setLoadingStatus("Loading hand tracking...");
    await initHand();

    setLoadingStatus("Initializing audio...");
    initSound();

    setLoadingStatus("Preparing scene...");

    await new Promise(requestAnimationFrame);

    setLoadingStatus("Ready!");

    await new Promise((resolve) => setTimeout(resolve, 300));

    hideLoadingScreen();

    animate();

    console.log("Application ready");
  } catch (error) {
    console.error("Setup failed:", error);

    setLoadingStatus("Camera unavailable");

    updateGestureHUD(
      "Camera unavailable",
      "alert-circle"
    );
  }
}

initDebug();
setup();

// PAINTING UI
const transitionOverlay = document.getElementById("transition-overlay");
const colorSelector = document.getElementById("color-selector");
const paintingControls = document.getElementById("painting-controls");
const paintingDoneButton = document.getElementById("painting-done-button");
const sunflowerWheel = document.querySelector(".sunflower-wheel");
const petalColors = [
  0xff4500, 0xdc143c, 0xffd700, 0x808000, 0x87ceeb, 0x008080, 0x4b0082,
  0x800080, 0xe6e6fa, 0x4a3728, 0x36454f, 0xfff8dc,
];

// PAINTING DONE
if (paintingDoneButton) {
  paintingDoneButton.addEventListener("click", () => {
    console.log("Painting complete");
  });
}

// COLOR SELECTOR
if (sunflowerWheel) {
  petalColors.forEach((color, index) => {
    const petal = document.createElement("div");
    petal.className = "petal";
    petal.style.backgroundColor = COLOR[index];
    petal.dataset.color = COLOR[index];
    const angle = (index / petalColors.length) * Math.PI * 2;
    const radius = 70;
    const x = 100 + Math.cos(angle) * radius - 20;
    const y = 100 + Math.sin(angle) * radius - 30;
    petal.style.left = x + "px";
    petal.style.top = y + "px";
    petal.style.transform = `rotate(${angle + Math.PI / 2}rad)`;
    petal.addEventListener("click", () => {
      document.querySelectorAll(".petal").forEach((p) => {
        p.classList.remove("selected");
      });
      petal.classList.add("selected");
      state.paint.selectedColor = COLOR[index];
      const center = document.querySelector(".sunflower-center");
      if (center) {
        center.style.background = `radial-gradient(
                circle,
                ${state.paint.selectedColor} 0%,
                ${adjustColorBrightness(state.paint.selectedColor, -20)} 100%
              )`;
      }
      const preview = document.querySelector(".color-preview");
      if (preview) {
        preview.style.background = state.paint.selectedColor;
      }
    });
    sunflowerWheel.appendChild(petal);
  });
}

// INITIAL COLOR PREVIEW
const sunflowerCenter = document.querySelector(".sunflower-center");

if (sunflowerCenter) {
  sunflowerCenter.style.background = `radial-gradient(
      circle,
      ${state.paint.selectedColor} 0%,
      #8B4513 100%
    )`;
}

// CLAY UPDATE
function updateClay() {
  const radiusInput = Math.abs(state.sculpt.targetRadiusChange);
  const heightInput = Math.abs(state.sculpt.targetHeightChange);
  const inputStrength = THREE.MathUtils.clamp(
    (radiusInput + heightInput) / (SCULPT.MAX_FORCE * 2),
    0,
    1,
  );
  if (radiusInput > 0 || heightInput > 0) {
    deformClay(
      geometry,
      clayPositions,
      state.sculpt.targetRadiusChange,
      state.sculpt.targetHeightChange,
    );
    updateSculptSound(inputStrength);
  } else {
    stopSculptSound();
  }
  state.sculpt.targetRadiusChange = 0;
  state.sculpt.targetHeightChange = 0;
}

// ANIMATION
function animate() {
  requestAnimationFrame(animate);
  const video = getDebugVideo();
  const hand = detectHand(video, performance.now());
  if (hand && hand.length >= 21) {
    // DEBUG HAND
    drawHand(hand);

    // PROCESS HAND ONCE
    updateHandInput({
      hand,
      camera,
      pot,
      geometry,
      targetFinger,
      finger
    });

    finger.position.lerp(targetFinger, 0.2);
  } else {
    state.sculpt.lastHeightY = null;
    state.sculpt.pinchActive = false;
    updateGestureHUD("Waiting for hand gesture...", "activity");
    stopSculptSound();
  }

  // CAMERA
  state.camera.angle += (state.camera.targetAngle - state.camera.angle) * 0.1;
  updateCamera();

  // CLAY
  if (state.room === ROOM_STATE.SCULPT_ROOM) {
    updateClay();
  }

  // POTTERY WHEEL
  if (state.room === ROOM_STATE.SCULPT_ROOM) {
    const time = performance.now() * 0.001;
    const WHEEL_BASE_SPEED = 0.5;
    const WHEEL_WAVE = Math.sin(time * 0.7) * 0.08;
    const WHEEL_SPEED = WHEEL_BASE_SPEED + WHEEL_WAVE;
    pot.rotation.y += WHEEL_SPEED;
    updateWheelSound(WHEEL_SPEED / WHEEL_BASE_SPEED);
  } else {
    updateWheelSound(0);
  }

  // RENDER
  renderer.render(scene, camera);
}

animate();

// RESIZE
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
