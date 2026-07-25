import * as THREE from "three";

// =====================
// Painting Room Environment Setup
// =====================

export function setupPaintingEnvironment(scene) {
  
  // =====================
  // Painting Room (Sky Dome)
  // =====================
  
  const roomGeometry = new THREE.SphereGeometry(30, 32, 32);
  const roomMaterial = new THREE.MeshBasicMaterial({
    color: 0x1a1815,
    side: THREE.BackSide,
    depthWrite: false
  });
  const room = new THREE.Mesh(roomGeometry, roomMaterial);
  room.renderOrder = -1;
  scene.add(room);
  
  // =====================
  // Wooden Painting Table
  // =====================
  
  // Main painting table surface
  const tableGeometry = new THREE.BoxGeometry(4.5, 0.12, 3.2);
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x6B4423,
    roughness: 0.8,
    metalness: 0.05
  });
  const table = new THREE.Mesh(tableGeometry, woodMaterial);
  table.position.set(0, -0.1, 0);
  table.receiveShadow = true;
  scene.add(table);
  
  // Table legs
  const legGeometry = new THREE.BoxGeometry(0.08, 1.4, 0.08);
  const legPositions = [
    [-2, -0.8, -1.4],
    [2, -0.8, -1.4],
    [-2, -0.8, 1.4],
    [2, -0.8, 1.4]
  ];
  
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, woodMaterial);
    leg.position.set(...pos);
    leg.castShadow = true;
    scene.add(leg);
  });
  
  // =====================
  // Paint Jars
  // =====================
  
  const createPaintJar = (x, y, z, color) => {
    const jarGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.12, 16);
    const jarMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    const jar = new THREE.Mesh(jarGeometry, jarMaterial);
    jar.position.set(x, y, z);
    jar.castShadow = true;
    scene.add(jar);
    
    // Jar lid
    const lidGeometry = new THREE.CylinderGeometry(0.055, 0.055, 0.02, 16);
    const lidMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A3728,
      roughness: 0.6,
      metalness: 0
    });
    const lid = new THREE.Mesh(lidGeometry, lidMaterial);
    lid.position.set(x, y + 0.07, z);
    scene.add(lid);
  };
  
  // Arrange paint jars
  const paintColors = [
    0xFF4500, // Burnt Orange
    0xDC143C, // Crimson Red
    0xFFD700, // Mustard Yellow
    0x808000, // Olive Green
    0x87CEEB, // Sky Blue
    0x008080, // Teal
    0x4B0082, // Indigo
    0x800080, // Purple
    0xE6E6FA, // Lavender
    0x4A3728, // Deep Brown
    0x36454F, // Charcoal Grey
    0xFFF8DC  // Cream
  ];
  
  let jarIndex = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      if (jarIndex < paintColors.length) {
        createPaintJar(
          -1.5 + j * 0.15,
          0.02,
          -1.2 + i * 0.15,
          paintColors[jarIndex]
        );
        jarIndex++;
      }
    }
  }
  
  // =====================
  // Brushes
  // =====================
  
  const createBrush = (x, y, z, rotation) => {
    // Brush handle
    const handleGeometry = new THREE.CylinderGeometry(0.015, 0.012, 0.25, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x5B3A1D,
      roughness: 0.85,
      metalness: 0
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(x, y, z);
    handle.rotation.z = rotation;
    handle.castShadow = true;
    scene.add(handle);
    
    // Brush ferrule (metal part)
    const ferruleGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.03, 8);
    const ferruleMaterial = new THREE.MeshStandardMaterial({
      color: 0x707070,
      roughness: 0.4,
      metalness: 0.9
    });
    const ferrule = new THREE.Mesh(ferruleGeometry, ferruleMaterial);
    ferrule.position.set(x + Math.cos(rotation) * 0.12, y + Math.sin(rotation) * 0.12, z);
    ferrule.rotation.z = rotation;
    scene.add(ferrule);
    
    // Brush bristles
    const bristleGeometry = new THREE.ConeGeometry(0.02, 0.05, 8);
    const bristleMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.95,
      metalness: 0
    });
    const bristles = new THREE.Mesh(bristleGeometry, bristleMaterial);
    bristles.position.set(x + Math.cos(rotation) * 0.14, y + Math.sin(rotation) * 0.14, z);
    bristles.rotation.z = rotation + Math.PI / 2;
    scene.add(bristles);
  };
  
  // Arrange brushes in a holder
  createBrush(1.8, 0.02, -0.8, Math.PI / 6);
  createBrush(1.8, 0.02, -0.6, Math.PI / 4);
  createBrush(1.8, 0.02, -0.4, Math.PI / 3);
  createBrush(1.8, 0.02, -0.2, Math.PI / 5);
  
  // =====================
  // Brush Holder
  // =====================
  
  const holderGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.08, 16);
  const holderMaterial = new THREE.MeshStandardMaterial({
    color: 0x4A3728,
    roughness: 0.7,
    metalness: 0
  });
  const holder = new THREE.Mesh(holderGeometry, holderMaterial);
  holder.position.set(1.8, 0.02, -0.5);
  holder.castShadow = true;
  holder.receiveShadow = true;
  scene.add(holder);
  
  // =====================
  // Palette
  // =====================
  
  const paletteGeometry = new THREE.CylinderGeometry(0.25, 0.22, 0.02, 16);
  const paletteMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B7355,
    roughness: 0.6,
    metalness: 0
  });
  const palette = new THREE.Mesh(paletteGeometry, paletteMaterial);
  palette.position.set(1.5, 0.03, 0.8);
  palette.rotation.x = Math.PI / 2;
  palette.castShadow = true;
  scene.add(palette);
  
  // Paint stains on palette
  const stainColors = [0xFF4500, 0xDC143C, 0xFFD700, 0x87CEEB];
  stainColors.forEach((color, i) => {
    const stainGeometry = new THREE.CircleGeometry(0.03 + Math.random() * 0.02, 8);
    const stainMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0
    });
    const stain = new THREE.Mesh(stainGeometry, stainMaterial);
    const angle = (i / stainColors.length) * Math.PI * 2;
    const radius = 0.1 + Math.random() * 0.05;
    stain.position.set(
      1.5 + Math.cos(angle) * radius,
      0.04,
      0.8 + Math.sin(angle) * radius
    );
    stain.rotation.x = -Math.PI / 2;
    scene.add(stain);
  });
  
  // =====================
  // Paper Towels
  // =====================
  
  const towelGeometry = new THREE.BoxGeometry(0.3, 0.01, 0.2);
  const towelMaterial = new THREE.MeshStandardMaterial({
    color: 0xF5F5DC,
    roughness: 0.95,
    metalness: 0
  });
  const towel = new THREE.Mesh(towelGeometry, towelMaterial);
  towel.position.set(-1.5, 0.02, 0.8);
  towel.castShadow = true;
  scene.add(towel);
  
  // =====================
  // Cloth
  // =====================
  
  const clothGeometry = new THREE.PlaneGeometry(0.4, 0.3);
  const clothMaterial = new THREE.MeshStandardMaterial({
    color: 0xE8DCC8,
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide
  });
  const cloth = new THREE.Mesh(clothGeometry, clothMaterial);
  cloth.position.set(-1.8, 0.025, 0.3);
  cloth.rotation.x = -Math.PI / 2;
  cloth.rotation.z = 0.2;
  cloth.castShadow = true;
  scene.add(cloth);
  
  // =====================
  // Shelves with Pottery
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
  
  // Decorative painted pots on shelf
  const createPaintedPot = (x, y, z, scale, baseColor, accentColor) => {
    const potGeom = new THREE.LatheGeometry([
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.3 * scale, 0),
      new THREE.Vector2(0.4 * scale, 0.2 * scale),
      new THREE.Vector2(0.35 * scale, 0.5 * scale),
      new THREE.Vector2(0.25 * scale, 0.7 * scale),
      new THREE.Vector2(0.2 * scale, 0.7 * scale)
    ], 16);
    
    // Create multi-material for painted effect
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.85,
      metalness: 0
    });
    
    const pot = new THREE.Mesh(potGeom, baseMaterial);
    pot.position.set(x, y, z);
    pot.castShadow = true;
    scene.add(pot);
    
    // Add painted bands
    const bandGeometry = new THREE.TorusGeometry(0.3 * scale, 0.02, 8, 32);
    const bandMaterial = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.7,
      metalness: 0
    });
    
    for (let i = 0; i < 2; i++) {
      const band = new THREE.Mesh(bandGeometry, bandMaterial);
      band.position.set(x, y + 0.15 + i * 0.2, z);
      band.rotation.x = Math.PI / 2;
      scene.add(band);
    }
  };
  
  // Add painted pots to back shelf
  createPaintedPot(-2, 2.7, -4, 0.8, 0xCD853F, 0x8B4513);
  createPaintedPot(-1, 2.7, -4, 1, 0xDEB887, 0x654321);
  createPaintedPot(0.5, 2.7, -4, 0.9, 0xD2691E, 0xFFD700);
  createPaintedPot(1.8, 2.7, -4, 0.7, 0xBC8F8F, 0x800080);
  
  // Side shelf (left)
  const sideShelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
  sideShelf.rotation.y = Math.PI / 2;
  sideShelf.position.set(-4, 1.5, 0);
  sideShelf.receiveShadow = true;
  scene.add(sideShelf);
  
  // Pots on side shelf
  createPaintedPot(-4, 1.7, -1, 0.6, 0xDAA520, 0x8B0000);
  createPaintedPot(-4, 1.7, 0.5, 0.8, 0xB8860B, 0x228B22);
  createPaintedPot(-4, 1.7, 1.5, 0.7, 0xCD5C5C, 0x4169E1);
  
  // =====================
  // Small Paint Splashes
  // =====================
  
  const createPaintSplash = (x, y, z, color) => {
    const splashGeometry = new THREE.CircleGeometry(0.01 + Math.random() * 0.02, 6);
    const splashMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0
    });
    const splash = new THREE.Mesh(splashGeometry, splashMaterial);
    splash.position.set(x, y, z);
    splash.rotation.x = -Math.PI / 2;
    splash.rotation.z = Math.random() * Math.PI;
    scene.add(splash);
  };
  
  // Add paint splashes on table
  const splashColors = [0xFF4500, 0xDC143C, 0xFFD700, 0x87CEEB, 0x800080];
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.5 + Math.random() * 1.5;
    createPaintSplash(
      Math.cos(angle) * radius,
      0.015,
      Math.sin(angle) * radius,
      splashColors[Math.floor(Math.random() * splashColors.length)]
    );
  }
  
  // =====================
  // Tiny Pottery Tools
  // =====================
  
  const createTinyTool = (x, y, z) => {
    const toolGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 6);
    const toolMaterial = new THREE.MeshStandardMaterial({
      color: 0x707070,
      roughness: 0.5,
      metalness: 0.9
    });
    const tool = new THREE.Mesh(toolGeom, toolMaterial);
    tool.position.set(x, y, z);
    tool.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    tool.castShadow = true;
    scene.add(tool);
  };
  
  // Scatter tiny tools
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.2 + Math.random() * 0.8;
    createTinyTool(
      Math.cos(angle) * radius,
      0.015,
      Math.sin(angle) * radius
    );
  }
  
  // =====================
  // Warm Studio Lighting
  // =====================
  
  // Warm ambient light
  const warmAmbient = new THREE.AmbientLight(0xFFD4A6, 0.5);
  scene.add(warmAmbient);
  
  // Soft hemisphere light
  const hemiLight = new THREE.HemisphereLight(0xFFE4C4, 0x1a1815, 0.3);
  scene.add(hemiLight);
  
  // Key light from above/front
  const keyLight = new THREE.DirectionalLight(0xFFF0E0, 0.6);
  keyLight.position.set(2, 5, 3);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 50;
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);
  
  // Fill light from left
  const fillLight = new THREE.DirectionalLight(0xFFE4C4, 0.3);
  fillLight.position.set(-5, 3, 2);
  fillLight.castShadow = false;
  scene.add(fillLight);
  
  // Weak rim light from behind
  const rimLight = new THREE.DirectionalLight(0xFFDAB9, 0.15);
  rimLight.position.set(5, 2, -2);
  rimLight.castShadow = false;
  scene.add(rimLight);
  
  // Subtle top light
  const topLight = new THREE.PointLight(0xFFF8DC, 0.2, 20);
  topLight.position.set(0, 8, 0);
  topLight.castShadow = false;
  scene.add(topLight);
  
  return {
    room,
    table,
    backShelf,
    sideShelf
  };
}
