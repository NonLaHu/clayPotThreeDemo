import * as THREE from "three";
import "./style.css";
import {
  setupEnvironment
} from "./environment.js";
import {
  initHand,
  detectHand
} from "./hand.js";


const DEBUG = false; // false = hide everything

const video = document.createElement("video");

if (DEBUG) {
  video.style.position = "absolute";
  video.style.right = "20px";
  video.style.bottom = "20px";
  video.style.width = "320px";
  video.style.border = "2px solid white";
  video.style.zIndex = "10";
  video.style.transform = "scaleX(-1)";
  document.body.appendChild(video);
}


const HAND_CONNECTIONS = [

  [0, 1], [1, 2], [2, 3], [3, 4],

  [0, 5], [5, 6], [6, 7], [7, 8],

  [5, 9], [9, 10], [10, 11], [11, 12],

  [9, 13], [13, 14], [14, 15], [15, 16],

  [13, 17], [17, 18], [18, 19], [19, 20],

  [0, 17]

];

let debugCanvas;
let debugCtx;

if (DEBUG) {
  debugCanvas = document.createElement("canvas");
  debugCanvas.width = 320;
  debugCanvas.height = 240;

  debugCanvas.style.position = "absolute";
  debugCanvas.style.right = "20px";
  debugCanvas.style.bottom = "20px";
  debugCanvas.style.width = "320px";
  debugCanvas.style.height = "240px";
  debugCanvas.style.pointerEvents = "none";
  debugCanvas.style.zIndex = "20";

  document.body.appendChild(debugCanvas);

  debugCtx = debugCanvas.getContext("2d");
}



let lastPinchX = null;
let lastHeightY = null;
let pinchActive = false;
let pinchStartX = 0;

async function startCamera() {

  const stream =
    await navigator.mediaDevices.getUserMedia({
      video: {
        width: 640,
        height: 480
      }
    });


  video.srcObject = stream;

  await video.play();


  console.log(
    "camera ready"
  );

}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// =====================
// Environment Setup
// =====================

const environment = setupEnvironment(scene);




const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.set(
  3,
  2.5,
  5
);

camera.lookAt(
  0,
  1,
  0
);

const BRUSH_HEIGHT = 0.25;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let sculptPoint = null;

let targetRadiusChange = 0;
let targetHeightChange = 0;

let currentRadiusChange = 0;
let currentHeightChange = 0;

const CLAY_RESISTANCE = 0.05;
const MAX_FORCE = 0.005;

const renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(
  window.innerWidth,
  window.innerHeight
);
document.body.appendChild(renderer.domElement);

// =====================
// Camera Vertical Control
// =====================

let cameraDragging = false;
let cameraLastY = 0;

let cameraAngle = 0.45;

// window.addEventListener(
//   "pointerdown",
//   (e)=>{

//     if(e.ctrlKey){

//       cameraDragging = true;
//       cameraLastY = e.clientY;

//     }

//   }
// );


// window.addEventListener(
//   "pointerup",
//   ()=>{

//     cameraDragging = false;

//   }
// );


// window.addEventListener(
//   "pointermove",
//   (e)=>{

//     if(!cameraDragging)
//       return;


//     const delta =
//       (e.clientY - cameraLastY)
//       * 0.005;


//     cameraLastY = e.clientY;


//     cameraAngle += delta;


//     cameraAngle =
//       THREE.MathUtils.clamp(
//         cameraAngle,
//         -0.2,
//         1.2
//       );


//     updateCamera();

//   }
// );


function updateCamera() {

  const radius = 5;


  camera.position.y =
    2 +
    Math.sin(cameraAngle)
    * radius;


  camera.position.z =
    Math.cos(cameraAngle)
    * radius;


  camera.lookAt(
    0,
    1,
    0
  );

}

let targetCameraAngle = cameraAngle;


// =====================
// Clay Pot Geometry
// =====================

const points = [];

const MAX_HEIGHT = 4;
const INITIAL_HEIGHT = 2;
const segments = 64;

const thickness = 0.05;


// outer wall
for (let i = 0; i <= 40; i++) {

  const y =
    i / 40 * INITIAL_HEIGHT;


  let radius;

  if (y < 0.2) {
    radius = 0.8;
  }
  else if (y < 1.2) {
    radius = 0.55 + y * 0.15;
  }
  else {
    radius = 0.75 - (y - 1.2) * 0.25;
  }


  points.push(
    new THREE.Vector2(
      radius,
      y
    )
  );

}


// inner wall (reverse direction)
// inner wall
for (let i = 40; i >= 0; i--) {

  const y =
    i / 40 * INITIAL_HEIGHT;

  let radius;

  if (y < 0.2) {
    radius = 0.8;
  }
  else if (y < 1.2) {
    radius = 0.55 + y * 0.15;
  }
  else {
    radius = 0.75 - (y - 1.2) * 0.25;
  }


  points.push(
    new THREE.Vector2(
      radius - thickness,
      y
    )
  );



}
points.push(
  new THREE.Vector2(
    0,
    0.08
  )
);

const geometry =
  new THREE.LatheGeometry(
    points,
    segments
  );

const material = new THREE.MeshStandardMaterial({
  color: 0xb56535,
  roughness: 0.92,
  metalness: 0,
  side: THREE.DoubleSide // This makes both the inside and outside visible
});

const pot =
  new THREE.Mesh(
    geometry,
    material
  );


scene.add(pot);


const clayPositions =
  geometry.attributes.position.array.slice();



// =====================
// Ground
// =====================

const ground =
  new THREE.Mesh(
    new THREE.CylinderGeometry(
      1.2,
      1.2,
      0.1,
      64
    ),
    new THREE.MeshStandardMaterial({
      color: 0x333333
    })
  );

ground.position.y = -0.05;

scene.add(ground);


// =====================
// Lights
// =====================

scene.add(
  new THREE.HemisphereLight(
    0xffffff,
    0x444444,
    2
  )
);


const light =
  new THREE.DirectionalLight(
    0xffffff,
    2
  );

light.position.set(
  3,
  5,
  3
);

light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 50;

scene.add(light);

const targetFinger =
  new THREE.Vector3();

let finger;

// if (DEBUG) {

finger = new THREE.Mesh(
  new THREE.SphereGeometry(0.05),
  new THREE.MeshBasicMaterial({
    color: 0xff0000
  })
);

scene.add(finger);

// }

async function setup() {

  await startCamera();

  await initHand();

}


setup();

// =====================
// Clay Sculpting Control
// =====================

let dragging = false;

let lastX = 0;
let lastY = 0;


// store original profile
const clayProfile = points.map(p => ({
  radius: p.x,
  height: p.y
}));


window.addEventListener(
  "pointerdown",
  (e) => {

    if (e.ctrlKey)
      return;


    dragging = true;

    lastX = e.clientX;
    lastY = e.clientY;

  });


window.addEventListener(
  "pointerup",
  () => {

    dragging = false;

  }
);


window.addEventListener(
  "pointermove",
  (e) => {


    mouse.x =
      (e.clientX / window.innerWidth) * 2 - 1;

    mouse.y =
      -(e.clientY / window.innerHeight) * 2 + 1;


    raycaster.setFromCamera(
      mouse,
      camera
    );


    const hit =
      raycaster.intersectObject(
        pot
      );


    if (hit.length) {
      sculptPoint =
        hit[0].point.clone();
    }
    else {
      sculptPoint = null;
    }


    if (!dragging)
      return;



    const dx =
      (e.clientX - lastX) * 0.003;

    let dy = 0;

    if (e.shiftKey) {

      dy =
        (lastY - e.clientY)
        * 0.005;

    }


    lastX = e.clientX;
    lastY = e.clientY;


    targetRadiusChange +=
      dx * CLAY_RESISTANCE;


    if (e.shiftKey) {

      targetHeightChange +=
        dy * CLAY_RESISTANCE;

    }


    // limit input force

    targetRadiusChange =
      THREE.MathUtils.clamp(
        targetRadiusChange,
        -MAX_FORCE,
        MAX_FORCE
      );


    targetHeightChange =
      THREE.MathUtils.clamp(
        targetHeightChange,
        -MAX_FORCE,
        MAX_FORCE
      );

  }
);


function deformClay(radiusChange, heightChange) {

  if (!sculptPoint)
    return;


  const pos =
    geometry.attributes.position;


  for (
    let i = 0;
    i < pos.count;
    i++
  ) {

    const ox =
      clayPositions[i * 3];

    const oy =
      clayPositions[i * 3 + 1];

    const oz =
      clayPositions[i * 3 + 2];

    const heightDistance =
      Math.abs(
        oy - sculptPoint.y
      );


    if (heightDistance > BRUSH_HEIGHT)
      continue;


    const brushStrength =
      1 -
      (heightDistance / BRUSH_HEIGHT);

    const normalized =
      THREE.MathUtils.clamp(
        oy / INITIAL_HEIGHT,
        0,
        1
      );


    const influence = 1;


    // radius
    const radius =
      Math.sqrt(
        ox * ox +
        oz * oz
      );


    const angle =
      Math.atan2(
        oz,
        ox
      );


    const deformation =
      THREE.MathUtils.clamp(
        radiusChange *
        influence *
        brushStrength *
        3,
        -0.003,
        0.003
      );


    const newRadius =
      radius *
      (
        1 + deformation
      );


    const heightScale =
      1 +
      heightChange *
      brushStrength *
      8;


    const newY =
      oy *
      heightScale;


    pos.setX(
      i,
      Math.cos(angle) * newRadius
    );


    pos.setZ(
      i,
      Math.sin(angle) * newRadius
    );


    pos.setY(
      i,
      THREE.MathUtils.clamp(
        newY,
        0,
        MAX_HEIGHT
      )
    );

  }


  pos.needsUpdate = true;

  for (
    let i = 0;
    i < pos.count * 3;
    i++
  ) {
    clayPositions[i] =
      pos.array[i];
  }

  geometry.computeVertexNormals();

}

function isOpenPalm(hand) {

  return (
    hand[8].y < hand[6].y && // index
    hand[12].y < hand[10].y && // middle
    hand[16].y < hand[14].y && // ring
    hand[20].y < hand[18].y    // pinky
  );

}

// =====================
// Animation
// =====================

function updateClay() {

  deformClay(
    targetRadiusChange,
    targetHeightChange
  );


  // consume input
  targetRadiusChange = 0;
  targetHeightChange = 0;

}

function isHeightGesture(hand) {

  const indexOpen =
    hand[8].y < hand[6].y;

  const middleOpen =
    hand[12].y < hand[10].y;

  const ringClosed =
    hand[16].y > hand[14].y;

  const pinkyClosed =
    hand[20].y > hand[18].y;


  return (
    indexOpen &&
    middleOpen &&
    ringClosed &&
    pinkyClosed
  );
}

function getPinchStrength(hand) {

  const thumb =
    new THREE.Vector3(
      hand[4].x,
      hand[4].y,
      hand[4].z
    );


  const index =
    new THREE.Vector3(
      hand[8].x,
      hand[8].y,
      hand[8].z
    );


  const distance =
    thumb.distanceTo(index);

  return THREE.MathUtils.clamp(
    THREE.MathUtils.mapLinear(
      distance,
      0.02,
      0.15,
      1,
      0
    ),
    0,
    1
  );

}


function animate() {

  requestAnimationFrame(
    animate
  );
  const hand = detectHand(
    video,
    performance.now()
  );


  if (hand) {

    const index =
      hand[8];
    const pinch =
      getPinchStrength(hand);

    if (DEBUG) {


      debugCtx.clearRect(
        0,
        0,
        debugCanvas.width,
        debugCanvas.height
      );

      debugCtx.strokeStyle = "lime";
      debugCtx.fillStyle = "red";
      debugCtx.lineWidth = 2;

      for (const p of hand) {

        const x = (1 - p.x) * debugCanvas.width;
        const y = p.y * debugCanvas.height;

        debugCtx.beginPath();
        debugCtx.arc(
          x,
          y,
          4,
          0,
          Math.PI * 2
        );
        debugCtx.fill();

      }

      debugCtx.strokeStyle = "cyan";

      for (const [a, b] of HAND_CONNECTIONS) {

        debugCtx.beginPath();

        debugCtx.moveTo(
          (1 - hand[a].x) * debugCanvas.width,
          hand[a].y * debugCanvas.height
        );

        debugCtx.lineTo(
          (1 - hand[b].x) * debugCanvas.width,
          hand[b].y * debugCanvas.height
        );

        debugCtx.stroke();

      }
    }

    if (pinch > 0.5) {
      lastHeightY = null;
      if (!pinchActive) {

        pinchActive = true;
        pinchStartX = index.x;

      }


      const movement =
        index.x - pinchStartX;


      targetRadiusChange =
        movement *
        pinch *
        CLAY_RESISTANCE;


    }
    else {

      pinchActive = false;

    }

    if (isHeightGesture(hand)) {


      const middle =
        hand[12];


      if (lastHeightY !== null) {

        const movement =
          lastHeightY - middle.y;


        targetHeightChange +=
          movement *
          CLAY_RESISTANCE;


        targetHeightChange =
          THREE.MathUtils.clamp(
            targetHeightChange,
            -MAX_FORCE,
            MAX_FORCE
          );

      }


      lastHeightY = middle.y;


    }
    else {

      lastHeightY = null;

    }

    if (isOpenPalm(hand)) {

      const palmY =
        (
          hand[0].y +
          hand[5].y +
          hand[9].y +
          hand[13].y +
          hand[17].y
        ) / 5;


      targetCameraAngle =
        THREE.MathUtils.mapLinear(
          palmY,
          0.2,
          0.8,
          -0.2,
          1.2
        );

    }


    mouse.x =
      1 - index.x * 2;

    mouse.y =
      1 - index.y * 2;

    raycaster.setFromCamera(
      mouse,
      camera
    );

    const hit =
      raycaster.intersectObject(
        pot
      );

    if (hit.length) {

      sculptPoint =
        hit[0].point.clone();


      const normal =
        hit[0].face.normal.clone();

      normal.transformDirection(
        pot.matrixWorld
      );


      targetFinger.copy(
        hit[0].point
      );


      targetFinger.addScaledVector(
        normal,
        0.03
      );

    }
    else {

      sculptPoint = null;

    }

    if (finger) {

      finger.position.lerp(
        targetFinger,
        0.2
      );

    }

  }

  cameraAngle +=
    (targetCameraAngle - cameraAngle)
    * 0.1;

  updateCamera();

  updateClay();


  pot.rotation.y += 0.005;


  renderer.render(
    scene,
    camera
  );

}


animate();


// =====================
// Resize
// =====================

window.addEventListener(
  "resize",
  () => {

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

  }
);