// src/sound.js

let audioContext = null;
let initialized = false;
let soundEnabled = false;

// Master
let masterGain;

// =========================
// Wheel
// =========================

let wheelOscillator;
let wheelOscillator2;

let wheelGain;
let wheelGain2;

let wheelFilter;

// =========================
// Sculpting
// =========================

let sculptSource;
let sculptGain;
let sculptFilter;


// =====================================================
// INITIALIZE
// =====================================================

export function initSound() {
  if (initialized) {
    return;
  }

  const AudioContext =
    window.AudioContext ||
    window.webkitAudioContext;

  if (!AudioContext) {
    console.warn(
      "Web Audio API is not supported.",
    );
    return;
  }

  audioContext = new AudioContext();

  // =========================
  // Master
  // =========================

  masterGain =
    audioContext.createGain();

  masterGain.gain.value = 0.8;

  masterGain.connect(
    audioContext.destination,
  );

  // =====================================================
  // WHEEL SOUND
  // =====================================================

  wheelFilter =
    audioContext.createBiquadFilter();

  wheelFilter.type = "lowpass";
  wheelFilter.frequency.value = 300;
  wheelFilter.Q.value = 0.7;

  wheelGain =
    audioContext.createGain();

  wheelGain.gain.value = 0;

  wheelGain2 =
    audioContext.createGain();

  wheelGain2.gain.value = 0;

  // Main wheel tone

  wheelOscillator =
    audioContext.createOscillator();

  wheelOscillator.type = "sine";
  wheelOscillator.frequency.value = 70;

  wheelOscillator
    .connect(wheelGain)
    .connect(wheelFilter)
    .connect(masterGain);

  wheelOscillator.start();

  // Secondary harmonic

  wheelOscillator2 =
    audioContext.createOscillator();

  wheelOscillator2.type = "triangle";
  wheelOscillator2.frequency.value = 140;

  wheelOscillator2
    .connect(wheelGain2)
    .connect(wheelFilter)
    .connect(masterGain);

  wheelOscillator2.start();

  // =====================================================
  // SCULPTING SOUND
  // =====================================================

  sculptSource =
    createNoiseSource();

  sculptFilter =
    audioContext.createBiquadFilter();

  sculptFilter.type = "bandpass";
  sculptFilter.frequency.value = 900;
  sculptFilter.Q.value = 1.2;

  sculptGain =
    audioContext.createGain();

  sculptGain.gain.value = 0;

  sculptSource
    .connect(sculptFilter)
    .connect(sculptGain)
    .connect(masterGain);

  initialized = true;

  console.log(
    "Audio initialized:",
    audioContext.state,
  );
}


// =====================================================
// NOISE
// =====================================================

function createNoiseSource() {
  const bufferSize =
    audioContext.sampleRate * 2;

  const buffer =
    audioContext.createBuffer(
      1,
      bufferSize,
      audioContext.sampleRate,
    );

  const data =
    buffer.getChannelData(0);

  for (
    let i = 0;
    i < bufferSize;
    i++
  ) {
    data[i] =
      Math.random() * 2 - 1;
  }

  const source =
    audioContext.createBufferSource();

  source.buffer = buffer;
  source.loop = true;

  source.start();

  return source;
}


// =====================================================
// RESUME
// =====================================================

export async function resumeSound() {
  if (!initialized) {
    initSound();
  }

  if (
    audioContext.state ===
    "suspended"
  ) {
    await audioContext.resume();
  }

  console.log(
    "Audio state:",
    audioContext.state,
  );

  return audioContext.state;
}


// =====================================================
// ENABLE / DISABLE
// =====================================================

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;

  if (!initialized) {
    return;
  }

  const now =
    audioContext.currentTime;

  const target =
    enabled ? 1 : 0;

  masterGain.gain.setTargetAtTime(
    target,
    now,
    0.03,
  );

  console.log(
    "Sound:",
    enabled
      ? "ON"
      : "OFF",
  );
}

// =====================================================
// WHEEL
// =====================================================

export function updateWheelSound(
  speed,
) {
  if (
    !initialized ||
    !soundEnabled ||
    audioContext.state !== "running"
  ) {
    return;
  }

  const now =
    audioContext.currentTime;

  const normalized =
    Math.max(
      0,
      Math.min(speed, 2),
    );

  // Frequency follows wheel speed

  const frequency =
    55 +
    normalized * 70;

  wheelOscillator.frequency
    .setTargetAtTime(
      frequency,
      now,
      0.05,
    );

  wheelOscillator2.frequency
    .setTargetAtTime(
      frequency * 2,
      now,
      0.05,
    );

  // Make the wheel clearly audible

  const volume =
    Math.min(
      normalized * 0.12,
      0.18,
    );

  wheelGain.gain
    .setTargetAtTime(
      volume,
      now,
      0.08,
    );

  wheelGain2.gain
    .setTargetAtTime(
      volume * 0.25,
      now,
      0.08,
    );
}


// =====================================================
// SCULPTING
// =====================================================

export function updateSculptSound(
  strength,
) {
  if (
    !initialized ||
    !soundEnabled ||
    audioContext.state !== "running"
  ) {
    return;
  }

  const amount =
    Math.max(
      0,
      Math.min(strength, 1),
    );

  const now =
    audioContext.currentTime;

  const volume =
    amount * 0.3;

  const frequency =
    500 +
    amount * 1400;

  sculptFilter.frequency
    .setTargetAtTime(
      frequency,
      now,
      0.025,
    );

  sculptGain.gain
    .setTargetAtTime(
      volume,
      now,
      0.025,
    );
}


// =====================================================
// STOP SCULPTING
// =====================================================

export function stopSculptSound() {
  if (!initialized) {
    return;
  }

  sculptGain.gain.setTargetAtTime(
    0,
    audioContext.currentTime,
    0.05,
  );
}


// =====================================================
// DEBUG TEST
// =====================================================

export function testSound() {
  if (!initialized) {
    initSound();
  }

  if (
    audioContext.state !==
    "running"
  ) {
    console.warn(
      "AudioContext is not running.",
    );

    return;
  }

  soundEnabled = true;

  console.log(
    "Testing wheel sound...",
  );

  updateWheelSound(1);

  setTimeout(() => {
    updateWheelSound(0);
  }, 1000);
}