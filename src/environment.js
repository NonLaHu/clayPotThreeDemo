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
    color: 0x1a1510,
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
    color: 0x7B4A2B,
    roughness: 0.85,
    metalness: 0.05
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
    color: 0x5B3A1D,
    roughness: 0.75,
    metalness: 0.05
  });
  
  // Back shelf
  const shelfGeometry = new THREE.BoxGeometry(6, 0.1, 0.8);
  const backShelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
  backShelf.position.set(0, 2.5, -4);
  backShelf.receiveShadow = true;
  scene.add(backShelf);
  
  // Decorative pots on shelf - randomized materials for handcrafted feel
  const createDecorativePot = (x, y, z, scale) => {
    // Randomize pot material slightly for handmade variation
    const hueVariation = 0.95 + Math.random() * 0.1;
    const brightnessVariation = 0.9 + Math.random() * 0.2;
    const baseColor = new THREE.Color(0xCD853F);
    baseColor.multiplyScalar(brightnessVariation);
    baseColor.offsetHSL(0, 0, (hueVariation - 1) * 0.1);
    
    const potMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.85 + Math.random() * 0.1,
      metalness: 0
    });
    
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
  
  // Brushed steel for tools
  const toolMaterial = new THREE.MeshStandardMaterial({
    color: 0x707070,
    roughness: 0.5,
    metalness: 0.9
  });
  
  // Darker worn wood for tool handles
  const handleWoodMaterial = new THREE.MeshStandardMaterial({
    color: 0x5B3A1D,
    roughness: 0.9,
    metalness: 0
  });
  
  // Sculpting tool
  const toolHandleGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
  const toolHandle = new THREE.Mesh(toolHandleGeom, handleWoodMaterial);
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
  
  // Clay material with subtle variation
  const clayMaterial = new THREE.MeshStandardMaterial({
    color: 0xB56535,
    roughness: 0.95,
    metalness: 0
  });
  
  // Clay splatters/rocks with color variation
  const createClayPiece = (x, y, z, scale) => {
    const clayGeom = new THREE.DodecahedronGeometry(0.05 * scale, 0);
    
    // Subtle color variation for each piece
    const clayColor = new THREE.Color(0xB56535);
    clayColor.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
    
    const pieceMaterial = new THREE.MeshStandardMaterial({
      color: clayColor,
      roughness: 0.9 + Math.random() * 0.1,
      metalness: 0
    });
    
    const clayPiece = new THREE.Mesh(clayGeom, pieceMaterial);
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
  
  // Add tiny clay crumbs for detail
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.5 + Math.random() * 1.5;
    createClayPiece(
      Math.cos(angle) * radius,
      0.02,
      Math.sin(angle) * radius,
      0.3 + Math.random() * 0.3
    );
  }
  
  // =====================
  // Book
  // =====================
  
  const bookCoverGeom = new THREE.BoxGeometry(0.3, 0.05, 0.4);
  const bookCoverMaterial = new THREE.MeshStandardMaterial({
    color: 0x3A2718,
    roughness: 0.7,
    metalness: 0
  });
  const bookCover = new THREE.Mesh(bookCoverGeom, bookCoverMaterial);
  bookCover.position.set(-1.8, 0.03, 0.5);
  bookCover.rotation.y = 0.3;
  scene.add(bookCover);
  
  const bookPagesGeom = new THREE.BoxGeometry(0.28, 0.04, 0.38);
  const bookPagesMaterial = new THREE.MeshStandardMaterial({
    color: 0xE5E5CC,
    roughness: 0.95,
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
  const warmAmbient = new THREE.AmbientLight(0xFFD4A6, 0.5);
  scene.add(warmAmbient);
  
  // Soft hemisphere light for natural sky lighting
  const hemiLight = new THREE.HemisphereLight(0xFFE4C4, 0x2a2018, 0.3);
  scene.add(hemiLight);
  
  // Key light from above/front (warm)
  const keyLight = new THREE.DirectionalLight(0xFFF0E0, 0.6);
  keyLight.position.set(2, 5, 3);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 50;
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);
  
  // Fill light from left (softer)
  const fillLight = new THREE.DirectionalLight(0xFFE4C4, 0.3);
  fillLight.position.set(-5, 3, 2);
  fillLight.castShadow = false;
  scene.add(fillLight);
  
  // Weak rim light from behind (subtle)
  const rimLight = new THREE.DirectionalLight(0xFFDAB9, 0.15);
  rimLight.position.set(5, 2, -2);
  rimLight.castShadow = false;
  scene.add(rimLight);
  
  // Subtle top light for ambient fill
  const topLight = new THREE.PointLight(0xFFF8DC, 0.2, 20);
  topLight.position.set(0, 8, 0);
  topLight.castShadow = false;
  scene.add(topLight);
  
  return {
    room
  };
}
