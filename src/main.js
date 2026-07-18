import * as THREE from "three";
import "./style.css";


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

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

window.addEventListener(
  "pointerdown",
  (e)=>{

    if(e.ctrlKey){

      cameraDragging = true;
      cameraLastY = e.clientY;

    }

  }
);


window.addEventListener(
  "pointerup",
  ()=>{

    cameraDragging = false;

  }
);


window.addEventListener(
  "pointermove",
  (e)=>{

    if(!cameraDragging)
      return;


    const delta =
      (e.clientY - cameraLastY)
      * 0.005;


    cameraLastY = e.clientY;


    cameraAngle += delta;


    cameraAngle =
      THREE.MathUtils.clamp(
        cameraAngle,
        -0.2,
        1.2
      );


    updateCamera();

  }
);


function updateCamera(){

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


// =====================
// Clay Pot Geometry
// =====================

const points = [];

const height = 2;
const segments = 64;

for (let i = 0; i <= 20; i++) {

  const y = i / 20 * height;

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


const geometry =
  new THREE.LatheGeometry(
    points,
    segments
  );

  const originalPositions =
  geometry.attributes.position.array.slice();

const material = new THREE.MeshStandardMaterial({
  color: 0xb56535,
  roughness: 1.0,
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

scene.add(light);



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
(e)=>{

  if(e.ctrlKey)
    return;


  dragging = true;

  lastX=e.clientX;
  lastY=e.clientY;

});


window.addEventListener(
  "pointerup",
  ()=>{

    dragging = false;

  }
);


window.addEventListener(
  "pointermove",
  (e)=>{

    if(!dragging) return;


    const dx =
      (e.clientX - lastX) * 0.003;

    const dy =
      (lastY - e.clientY) * 0.005;


    lastX = e.clientX;
    lastY = e.clientY;


    targetRadiusChange += dx * CLAY_RESISTANCE;
    targetHeightChange += dy * CLAY_RESISTANCE;


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


function deformClay(radiusChange, heightChange){

  const pos =
    geometry.attributes.position;


  for(
    let i = 0;
    i < pos.count;
    i++
  ){

const ox =
clayPositions[i * 3];

const oy =
clayPositions[i * 3 + 1];

const oz =
clayPositions[i * 3 + 2];


    const normalized =
      THREE.MathUtils.clamp(
        oy / height,
        0,
        1
      );


    const influence =
      Math.sin(
        normalized * Math.PI
      );


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
      radiusChange * influence * 3,
      -0.003,
      0.003
    );


    const newRadius =
    radius *
    (
      1 + deformation
    );


    const newY =
    oy +
    THREE.MathUtils.clamp(
    heightChange * influence * 3,
    -0.01,
    0.01
    );


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
        3
      )
    );

  }


  pos.needsUpdate = true;

for(
 let i = 0;
 i < pos.count * 3;
 i++
){
  clayPositions[i] =
    pos.array[i];
}

  geometry.computeVertexNormals();

}

// =====================
// Animation
// =====================

function updateClay(){

  deformClay(
    targetRadiusChange,
    targetHeightChange
  );


  // consume input
  targetRadiusChange = 0;
  targetHeightChange = 0;

}

function animate(){

requestAnimationFrame(
animate
);


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
  ()=>{

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