import * as THREE from "three";

// DEBUG
export const DEBUG = true;
export const RETRY_DELAY = 2000; 

// ROOM
export const ROOM_STATE = {
  SCULPT_ROOM: "sculpt_room",
  PAINT_ROOM: "paint_room",
  DRAW_ROOM: "draw",
};

// PAINT 
export const PAINT = {
  RING_WIDTH: 2,
  RADIUS: 0.18,
};

// SCULPT
export const SCULPT = {
  BRUSH_HEIGHT: 0.10,
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
export const PATTERNS = [
  {
    id: "flower",
    src: "/patterns/flower.png",
    height: 0.50,
  },
  {
    id: "meadow_floral",
    src: "/patterns/Meadow floral, botanical florals, colorful, ivory_repeat_1.png",
    height: 0.30,
  },
  {
    id: "flower_repeat",
    src: "/patterns/jpg(2)_repeat_2.png",
    height: 0.15,
  },
  {
    id: "flower_rotated_original",
    src: "/patterns/jpg_rotated.png",
    height: 0.30,
  },
  {
    id: "vintage_rose",
    src: "/patterns/Vintage rose drawing with elegant Celtic patterns and swirling leaves illustration_rotated.png",
    height: 0.30,
  },
  {
    id: "flower4_rotated",
    src: "/patterns/jpg(4)_rotated.png",
    height: 0.40,
  },
  {
    id: "flower3_repeat",
    src: "/patterns/jpg(3)_rotated_repeat_2.png",
    height: 0.30,
  },
  {
    id: "flower1_padded",
    src: "/patterns/jpg(1)_padded.png",
    height: 0.50,
  },
  {
    id: "flower5_padded",
    src: "/patterns/jpg(5)_padded.png",
    height: 0.50,
  },
  {
    id: "flower6_padded",
    src: "/patterns/jpg(6)_padded.png",
    height: 0.50,
  },
  {
    id: "flower8_padded",
    src: "/patterns/jpg(8)_padded.png",
    height: 0.50,
  },
];

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