import * as THREE from "three";

// ROOM
export const ROOM_STATE = {
  SCULPT_ROOM: "sculpt_room",
  PAINT_ROOM: "paint_room",
};

// PAINT 
export const PAINT = {
  RING_WIDTH: 2,
  RADIUS: 0.18,
};

// SCULPT
export const SCULPT = {
  BRUSH_HEIGHT: 0.25,
  CLAY_RESISTANCE: 0.05,
  MAX_FORCE: 0.005,
};

// CLAYPOT
export const CLAY_POT = {
  MAX_HEIGHT: 4,
  INITIAL_HEIGHT: 2,
  SEGMENTS : 64,
  THICKNESS : 0.05,
  CYLINDER_RADIUS : 0.7,
};

// COLORS
export const COLOR = [
  "#FF4500",
  "#DC143C",
  "#FFD700",
  "#808000",
  "#87CEEB",
  "#008080",
  "#4B0082",
  "#800080",
  "#E6E6FA",
  "#4A3728",
  "#36454F",
  "#FFF8DC",
];

export const COLOR_COUNT = COLOR.length;

// HAND CONNECTIONS
export const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],

  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],

  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],

  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],

  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],

  [0, 17],
];

export const raycaster = new THREE.Raycaster();
export const mouse = new THREE.Vector2();