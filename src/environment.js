import * as THREE from "three";

// =====================
// Environment Setup
// =====================

export function setupEnvironment(scene) {
  
  // =====================
  // Workshop Room (Sky Dome)
  // =====================
  
  const roomGeometry = new THREE.SphereGeometry(30, 32, 32);
  const roomMaterial = new THREE.MeshBasicMaterial({
    color: 0x2a2018,
    side: THREE.BackSide,
    depthWrite: false
  });
  const room = new THREE.Mesh(roomGeometry, roomMaterial);
  room.renderOrder = -1;
  scene.add(room);
  
  // =====================
  // Wooden Workbench
  // =====================
  
  // Main workbench surface
  const workbenchGeometry = new THREE.BoxGeometry(4, 0.15, 3);
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B5A2B,
    roughness: 0.8,
    metalness: 0.1
  });
  const workbench = new THREE.Mesh(workbenchGeometry, woodMaterial);
  workbench.position.set(0, -0.1, 0);
  workbench.receiveShadow = true;
  scene.add(workbench);
  
  // Workbench legs
  const legGeometry = new THREE.BoxGeometry(0.1, 1.5, 0.1);
  const legPositions = [
    [-1.8, -0.9, -1.3],
    [1.8, -0.9, -1.3],
    [-1.8, -0.9, 1.3],
    [1.8, -0.9, 1.3]
  ];
  
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, woodMaterial);
    leg.position.set(...pos);
    leg.castShadow = true;
    scene.add(leg);
  });
  
  // =====================
  // Shelves with Pots
  // =====================
  
  const shelfMaterial = new THREE.MeshStandardMaterial({
    color: 0x6B4423,
    roughness: 0.7,
    metalness: 0.1
  });
  
  // Back shelf
  const shelfGeometry = new THREE.BoxGeometry(6, 0.1, 0.8);
  const backShelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
  backShelf.position.set(0, 2.5, -4);
  backShelf.receiveShadow = true;
  scene.add(backShelf);
  
  // Decorative pots on shelf
  const potMaterial = new THREE.MeshStandardMaterial({
    color: 0xCD853F,
    roughness: 0.9,
    metalness: 0
  });
  
  const createDecorativePot = (x, y, z, scale) => {
    const potGeom = new THREE.LatheGeometry([
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.3 * scale, 0),
      new THREE.Vector2(0.4 * scale, 0.2 * scale),
      new THREE.Vector2(0.35 * scale, 0.5 * scale),
      new THREE.Vector2(0.25 * scale, 0.7 * scale),
      new THREE.Vector2(0.2 * scale, 0.7 * scale)
    ], 16);
    const pot = new THREE.Mesh(potGeom, potMaterial);
    pot.position.set(x, y, z);
    pot.castShadow = true;
    scene.add(pot);
  };
  
  // Add pots to back shelf
  createDecorativePot(-2, 2.7, -4, 0.8);
  createDecorativePot(-1, 2.7, -4, 1);
  createDecorativePot(0.5, 2.7, -4, 0.9);
  createDecorativePot(1.8, 2.7, -4, 0.7);
  
  // Side shelf (left)
  const sideShelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
  sideShelf.rotation.y = Math.PI / 2;
  sideShelf.position.set(-4, 1.5, 0);
  sideShelf.receiveShadow = true;
  scene.add(sideShelf);
  
  // Pots on side shelf
  createDecorativePot(-4, 1.7, -1, 0.6);
  createDecorativePot(-4, 1.7, 0.5, 0.8);
  createDecorativePot(-4, 1.7, 1.5, 0.7);
  
  // =====================
  // Pottery Tools
  // =====================
  
  const toolMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.4,
    metalness: 0.8
  });
  
  // Sculpting tool
  const toolHandleGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
  const toolHandle = new THREE.Mesh(toolHandleGeom, woodMaterial);
  toolHandle.position.set(1.5, 0.05, 1);
  toolHandle.rotation.z = Math.PI / 4;
  scene.add(toolHandle);
  
  const toolHeadGeom = new THREE.SphereGeometry(0.03, 8, 8);
  const toolHead = new THREE.Mesh(toolHeadGeom, toolMaterial);
  toolHead.position.set(1.65, 0.15, 1);
  scene.add(toolHead);
  
  // Ribbon tool
  const ribbonToolGeom = new THREE.BoxGeometry(0.02, 0.15, 0.01);
  const ribbonTool = new THREE.Mesh(ribbonToolGeom, toolMaterial);
  ribbonTool.position.set(-1.5, 0.05, 1.2);
  ribbonTool.rotation.z = Math.PI / 6;
  scene.add(ribbonTool);
  
  // =====================
  // Clay Pieces
  // =====================
  
  const clayMaterial = new THREE.MeshStandardMaterial({
    color: 0xB56535,
    roughness: 1.0,
    metalness: 0
  });
  
  // Clay splatters/rocks
  const createClayPiece = (x, y, z, scale) => {
    const clayGeom = new THREE.DodecahedronGeometry(0.05 * scale, 0);
    const clayPiece = new THREE.Mesh(clayGeom, clayMaterial);
    clayPiece.position.set(x, y, z);
    clayPiece.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    clayPiece.castShadow = true;
    scene.add(clayPiece);
  };
  
  // Scatter clay pieces around workbench
  createClayPiece(1.2, 0.03, 0.8, 1);
  createClayPiece(-1.3, 0.03, 1.1, 0.8);
  createClayPiece(0.8, 0.03, -1.2, 1.2);
  createClayPiece(-0.9, 0.03, -0.9, 0.9);
  createClayPiece(1.5, 0.03, -0.5, 0.7);
  createClayPiece(-1.6, 0.03, 0.3, 1.1);
  
  // =====================
  // Book
  // =====================
  
  const bookCoverGeom = new THREE.BoxGeometry(0.3, 0.05, 0.4);
  const bookCoverMaterial = new THREE.MeshStandardMaterial({
    color: 0x4A3728,
    roughness: 0.6,
    metalness: 0
  });
  const bookCover = new THREE.Mesh(bookCoverGeom, bookCoverMaterial);
  bookCover.position.set(-1.8, 0.03, 0.5);
  bookCover.rotation.y = 0.3;
  scene.add(bookCover);
  
  const bookPagesGeom = new THREE.BoxGeometry(0.28, 0.04, 0.38);
  const bookPagesMaterial = new THREE.MeshStandardMaterial({
    color: 0xF5F5DC,
    roughness: 0.9,
    metalness: 0
  });
  const bookPages = new THREE.Mesh(bookPagesGeom, bookPagesMaterial);
  bookPages.position.set(-1.8, 0.05, 0.5);
  bookPages.rotation.y = 0.3;
  scene.add(bookPages);
  
  // =====================
  // Warm Studio Lighting
  // =====================
  
  // Warm ambient light (enhanced)
  const warmAmbient = new THREE.AmbientLight(0xFFD4A6, 0.4);
  scene.add(warmAmbient);
  
  // Fill light from left
  const fillLight = new THREE.DirectionalLight(0xFFE4C4, 0.5);
  fillLight.position.set(-5, 3, 2);
  fillLight.castShadow = true;
  fillLight.shadow.mapSize.width = 1024;
  fillLight.shadow.mapSize.height = 1024;
  fillLight.shadow.camera.near = 0.5;
  fillLight.shadow.camera.far = 50;
  scene.add(fillLight);
  
  // Rim light from right
  const rimLight = new THREE.DirectionalLight(0xFFDAB9, 0.3);
  rimLight.position.set(5, 2, -2);
  rimLight.castShadow = true;
  rimLight.shadow.mapSize.width = 1024;
  rimLight.shadow.mapSize.height = 1024;
  rimLight.shadow.camera.near = 0.5;
  rimLight.shadow.camera.far = 50;
  scene.add(rimLight);
  
  // Subtle top light
  const topLight = new THREE.PointLight(0xFFF8DC, 0.4, 20);
  topLight.position.set(0, 8, 0);
  topLight.castShadow = true;
  topLight.shadow.mapSize.width = 1024;
  topLight.shadow.mapSize.height = 1024;
  topLight.shadow.camera.near = 0.5;
  topLight.shadow.camera.far = 50;
  scene.add(topLight);
  
  return {
    room
  };
}
