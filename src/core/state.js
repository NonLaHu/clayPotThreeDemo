// core/state.js

import { ROOM_STATE } from "./constants.js";
import * as THREE from "three";


export const state = {
  room: ROOM_STATE.SCULPT_ROOM,
  video: null,

  draw : {
    selectedPatternIndex: 0,
    patternPickerActive: false,
    patternPickerAngle: 0,
  },

camera: {
  angle: 0.45,
  targetAngle: 0.45,

  verticalAngle: 0.15,
  targetVerticalAngle: 0.15,

  radius: 5,

  minVerticalAngle: -0.1,
  maxVerticalAngle: 0.8,
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
    colorLockStartTime: null,
    colorLockActive: false,
    colorLockDuration: 3000,
    lastLockedColorIndex: null,
  },

  rooms : {
    sculptingEnvironmentGroup: null,
    paintingEnvironmentGroup: null,
  },
};