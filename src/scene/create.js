import * as THREE from "three";

import { CLAY_POT, PAINT } from "../core/constants.js";

export function create() {
  const points = [];

  // Outer wall
  for (let i = 0; i <= 40; i++) {
    const y = (i / 40) * CLAY_POT.INITIAL_HEIGHT;

    points.push(new THREE.Vector2(CLAY_POT.CYLINDER_RADIUS, y));
  }

  // Inner wall
  for (let i = 40; i >= 0; i--) {
    const y = (i / 40) * CLAY_POT.INITIAL_HEIGHT;

    points.push(
      new THREE.Vector2(CLAY_POT.CYLINDER_RADIUS - CLAY_POT.THICKNESS, y),
    );
  }
  points.push(new THREE.Vector2(0, 0.08));

  // CREATE POT
  const geometry = new THREE.LatheGeometry(points, CLAY_POT.SEGMENTS);

  // PAINT VERTEX COLORS
  const vertexColors = new Float32Array(geometry.attributes.position.count * 3);

  for (let i = 0; i < geometry.attributes.position.count; i++) {
    vertexColors[i * 3] = 0.71;
    vertexColors[i * 3 + 1] = 0.396;
    vertexColors[i * 3 + 2] = 0.208;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(vertexColors, 3));

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0,
    side: THREE.DoubleSide,
    vertexColors: true,
  });

  const pot = new THREE.Mesh(geometry, material);

  return {
    pot,
    geometry,
  };
}

// GROUND
export const ground = new THREE.Mesh(
  new THREE.CylinderGeometry(1.2, 1.2, 0.1, 64),

  new THREE.MeshStandardMaterial({
    color: 0x333333,
  }),
);

// PAINTING HIGHLIGHT
const paintHighlightGeometry = new THREE.CylinderGeometry(
  0.76, // around the pot
  0.76,
  PAINT.RADIUS * 2, // vertical paint band
  64,
  1,
  true,
);
const paintHighlightMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  transparent: true,
  opacity: 0.2,
  side: THREE.DoubleSide,
  depthWrite: false,
});
export const paintHighlight = new THREE.Mesh(
  paintHighlightGeometry,
  paintHighlightMaterial,
);

export const targetFinger = new THREE.Vector3();
export const finger = new THREE.Mesh(
  new THREE.SphereGeometry(0.05),
  new THREE.MeshBasicMaterial({
    color: 0xff0000,
  }),
);

export const light = new THREE.DirectionalLight(0xffffff, 2);
