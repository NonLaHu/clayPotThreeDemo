import {
  FilesetResolver,
  HandLandmarker
} from "@mediapipe/tasks-vision";

import {
  isOpenPalm,
  isHeightGesture,
  isPointingGesture,
  isSpiderManSign,
  isFistGesture,
  getPinchStrength,
  getHandRotationDegrees
} from "../interaction/gestures.js";

let handLandmarker;
let video;
let canvas;
let ctx;
let animationId;
let lastVideoTime = -1;
let isTestActive = false;

function createGestureTestOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "gesture-test-overlay";
  overlay.className = "gesture-test-overlay";
  
  overlay.innerHTML = `
    <div class="gesture-test-panel">
      <div class="gesture-test-header">
        <h2>Gesture Test</h2>
        <button id="close-gesture-test" class="close-btn">
          <i data-feather="x"></i>
        </button>
      </div>
      
      <div class="video-wrapper">
        <video id="gesture-test-video" autoplay playsinline></video>
        <canvas id="gesture-test-canvas"></canvas>
        <div class="test-status" id="test-status">Initializing...</div>
      </div>
      
      <div class="gesture-results">
        <div class="gesture-result-card" id="result-openPalm">
          <span class="gesture-name">Open Palm</span>
          <span class="gesture-indicator" id="indicator-openPalm">❌</span>
        </div>
        <div class="gesture-result-card" id="result-heightGesture">
          <span class="gesture-name">Height Gesture</span>
          <span class="gesture-indicator" id="indicator-heightGesture">❌</span>
        </div>
        <div class="gesture-result-card" id="result-pointingGesture">
          <span class="gesture-name">Pointing</span>
          <span class="gesture-indicator" id="indicator-pointingGesture">❌</span>
        </div>
        <div class="gesture-result-card" id="result-spiderManSign">
          <span class="gesture-name">Spider-Man Sign</span>
          <span class="gesture-indicator" id="indicator-spiderManSign">❌</span>
        </div>
        <div class="gesture-result-card" id="result-fistGesture">
          <span class="gesture-name">Fist</span>
          <span class="gesture-indicator" id="indicator-fistGesture">❌</span>
        </div>
        <div class="gesture-result-card">
          <span class="gesture-name">Pinch Strength</span>
          <span class="gesture-value" id="value-pinchStrength">0.00</span>
        </div>
        <div class="gesture-result-card">
          <span class="gesture-name">Hand Rotation</span>
          <span class="gesture-value" id="value-handRotation">0°</span>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  if (window.feather) {
    window.feather.replace();
  }
  
  return overlay;
}

function updateGestureResults(hand) {
  const openPalm = isOpenPalm(hand);
  const heightGesture = isHeightGesture(hand);
  const pointingGesture = isPointingGesture(hand);
  const spiderManSign = isSpiderManSign(hand);
  const fistGesture = isFistGesture(hand);
  const pinchStrength = getPinchStrength(hand);
  const handRotation = getHandRotationDegrees(hand);
  
  updateIndicator('openPalm', openPalm);
  updateIndicator('heightGesture', heightGesture);
  updateIndicator('pointingGesture', pointingGesture);
  updateIndicator('spiderManSign', spiderManSign);
  updateIndicator('fistGesture', fistGesture);
  
  document.getElementById('value-pinchStrength').textContent = pinchStrength.toFixed(2);
  document.getElementById('value-handRotation').textContent = Math.round(handRotation) + '°';
  
  const status = document.getElementById('test-status');
  if (hand) {
    status.textContent = 'Hand detected ✓';
    status.className = 'test-status active';
  } else {
    status.textContent = 'No hand detected';
    status.className = 'test-status';
  }
}

function updateIndicator(name, isActive) {
  const card = document.getElementById(`result-${name}`);
  const indicator = document.getElementById(`indicator-${name}`);
  
  if (isActive) {
    card.classList.add('active');
    indicator.textContent = '✅';
  } else {
    card.classList.remove('active');
    indicator.textContent = '❌';
  }
}

async function setupCamera() {
  video = document.getElementById("gesture-test-video");
  canvas = document.getElementById("gesture-test-canvas");
  ctx = canvas.getContext("2d");
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    video.srcObject = stream;
    
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        resolve(video);
      };
    });
  } catch (error) {
    console.error("Camera access denied:", error);
    throw error;
  }
}

async function initHandLandmarker() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "/mediapipe/wasm"
    );

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/models/hand_landmarker.task"
      },
      runningMode: "VIDEO",
      numHands: 1
    });
    
    document.getElementById('test-status').textContent = 'Ready - Show your hand!';
    
  } catch (error) {
    console.error("MediaPipe initialization failed:", error);
    document.getElementById('test-status').textContent = 'MediaPipe failed';
    throw error;
  }
}

function detectHands() {
  if (!handLandmarker || !video || !isTestActive) return;
  
  const startTimeMs = performance.now();
  
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    
    const result = handLandmarker.detectForVideo(video, startTimeMs);
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (result.landmarks && result.landmarks.length > 0) {
      updateGestureResults(result.landmarks[0]);
    } else {
      updateGestureResults(null);
    }
  }
  
  animationId = requestAnimationFrame(detectHands);
}

export async function openGestureTest() {
  if (isTestActive) return;
  
  isTestActive = true;
  const overlay = createGestureTestOverlay();
  
  // Close button handler
  document.getElementById('close-gesture-test').addEventListener('click', closeGestureTest);
  
  try {
    await setupCamera();
    await initHandLandmarker();
    video.play();
    detectHands();
  } catch (error) {
    console.error("Failed to start gesture test:", error);
    closeGestureTest();
  }
}

export function closeGestureTest() {
  isTestActive = false;
  
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
  
  const overlay = document.getElementById('gesture-test-overlay');
  if (overlay) {
    overlay.remove();
  }
  
  handLandmarker = null;
  video = null;
  canvas = null;
  ctx = null;
  lastVideoTime = -1;
}
