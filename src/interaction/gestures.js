// interaction/gestures.js

import * as THREE from "three";

function isValidHand(hand) {
  return (
    Array.isArray(hand) &&
    hand.length >= 21 &&
    hand[4] &&
    hand[8] &&
    hand[12] &&
    hand[16] &&
    hand[20]
  );
}

export function isOpenPalm(hand) {
  if (!isValidHand(hand)) return false;

  return (
    hand[8].y < hand[6].y &&
    hand[12].y < hand[10].y &&
    hand[16].y < hand[14].y &&
    hand[20].y < hand[18].y
  );
}

export function isHeightGesture(hand) {
  if (!isValidHand(hand)) return false;

  return (
    hand[8].y < hand[6].y &&
    hand[12].y < hand[10].y &&
    hand[16].y > hand[14].y &&
    hand[20].y > hand[18].y
  );
}

export function isPointingGesture(hand) {
  if (!isValidHand(hand)) return false;

  return (
    hand[8].y < hand[6].y &&
    hand[12].y > hand[10].y &&
    hand[16].y > hand[14].y &&
    hand[20].y > hand[18].y
  );
}

export function isSpiderManSign(hand) {
  if (!isValidHand(hand)) return false;

  return (
    hand[8].y < hand[6].y &&
    hand[12].y > hand[10].y &&
    hand[16].y > hand[14].y &&
    hand[20].y < hand[18].y
  );
}

export function getPinchStrength(hand) {
  if (!isValidHand(hand)) {
    return 0;
  }

  const thumb = new THREE.Vector3(
    hand[4].x,
    hand[4].y,
    hand[4].z ?? 0,
  );

  const index = new THREE.Vector3(
    hand[8].x,
    hand[8].y,
    hand[8].z ?? 0,
  );

  const distance = thumb.distanceTo(index);

  const linearStrength = THREE.MathUtils.clamp(
    THREE.MathUtils.mapLinear(
      distance,
      0.015,
      0.1,
      1,
      0,
    ),
    0,
    1,
  );

  return Math.pow(linearStrength, 2);
}

export function getHandRotationDegrees(hand) {
  if (!isValidHand(hand)) {
    return 0;
  }

  const wrist = hand[0];
  const indexBase = hand[5];

  const dx = indexBase.x - wrist.x;
  const dy = indexBase.y - wrist.y;

  const angle =
    Math.atan2(dy, dx) *
    THREE.MathUtils.RAD2DEG;

  return (angle + 360) % 360;
}

export function isFistGesture(hand) {
  if (!isValidHand(hand)) return false;


  const isIndexCurled = hand[8].y > hand[6].y;
  const isMiddleCurled = hand[12].y > hand[10].y;
  const isRingCurled = hand[16].y > hand[14].y;
  const isPinkyCurled = hand[20].y > hand[18].y;

  const thumbTip = hand[4];
  const indexKnuckle = hand[5];
  const thumbDistance = Math.hypot(
    thumbTip.x - indexKnuckle.x,
    thumbTip.y - indexKnuckle.y
  );
  const isThumbTucked = thumbDistance < 0.1;

  return isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && isThumbTucked;
}

export function isThumbsUpGesture(hand) {
  if (!isValidHand(hand)) return false;

  // Check thumb is extended upward (thumb tip above thumb base)
  const thumbTip = hand[4];
  const thumbBase = hand[2];
  const isThumbExtended = thumbTip.y < thumbBase.y;

  // Check all other fingers are curled (tips below knuckles)
  const isIndexCurled = hand[8].y > hand[6].y;
  const isMiddleCurled = hand[12].y > hand[10].y;
  const isRingCurled = hand[16].y > hand[14].y;
  const isPinkyCurled = hand[20].y > hand[18].y;

  return isThumbExtended && isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled;
}