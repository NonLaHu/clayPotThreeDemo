// core/state.js

import { ROOM_STATE } from "./constants.js";
import * as THREE from "three";


export const state = {
  room: ROOM_STATE.SCULPT_ROOM,
  video: null,

  camera: {
    angle: 0.45,
    targetAngle: 0.45,
  },

  sculpt: {
    lastHeightY: null,
    pinchActive: false,
    pinchStartX: 0,
    targetRadiusChange: 0,
    targetHeightChange: 0,
    point: null,
  },

  paint: {
    colorPickerActive: false,
    lastSpiderSign: false,
    colorPickerAngle: 0,
    selectedColor: "#B56535",
    selectedColorIndex: 0,
  },

  rooms : {
    sculptingEnvironmentGroup: null,
    paintingEnvironmentGroup: null,
  },
};