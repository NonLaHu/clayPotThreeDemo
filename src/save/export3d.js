import * as THREE from "three";

import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

import { CLAY_POT } from "../core/constants.js";

// ------------------------------------------------------------
// Clean pot geometry
// ------------------------------------------------------------
// The live pot is a `LatheGeometry` deformed at runtime by mutating vertex
// positions. We rebuild a fresh, topologically-sound lathe (correct winding
// and UVs) here and inject the saved (deformed) positions back in, so the
// exported model is a clean single shell rather than a copy of live buffers.
function buildExportGeometry(positions) {
  const points = [];

  // Outer wall (mirrors src/scene/create.js profile).
  for (let i = 0; i <= 40; i++) {
    const y = (i / 40) * CLAY_POT.INITIAL_HEIGHT;
    points.push(new THREE.Vector2(CLAY_POT.CYLINDER_RADIUS, y));
  }

  // Inner wall.
  for (let i = 40; i >= 0; i--) {
    const y = (i / 40) * CLAY_POT.INITIAL_HEIGHT;
    points.push(
      new THREE.Vector2(CLAY_POT.CYLINDER_RADIUS - CLAY_POT.THICKNESS, y),
    );
  }
  points.push(new THREE.Vector2(0, 0.08));

  const geometry = new THREE.LatheGeometry(points, CLAY_POT.SEGMENTS);

  if (Array.isArray(positions) && positions.length === geometry.attributes.position.count * 3) {
    const attr = geometry.attributes.position;
    for (let i = 0; i < attr.count * 3; i++) {
      attr.array[i] = positions[i];
    }
    attr.needsUpdate = true;
  }

  geometry.computeVertexNormals();

  return geometry;
}

// ------------------------------------------------------------
// Public entry points
// ------------------------------------------------------------

/**
 * Build a fresh, exportable pot mesh from a save record.
 *
 * The live pot is rendered with a `MeshStandardMaterial({ vertexColors: true })`
 * whose `map` is the white-based pattern canvas (draw room). The saved vertex
 * `colors` already carry the painted rings as a smooth per-vertex gradient, so
 * we reproduce the exact on-screen appearance by keeping real vertex colors and
 * the pattern texture — no baking (baking flattened the gradient into harsh
 * horizontal stripes, which is what produced the "rings" in GLB viewers).
 */
export async function buildExportMesh({ positions, colors, patterns }) {
  const geometry = buildExportGeometry(positions);

  // Per-vertex colors (the painted rings / clay base).
  const colorAttr =
    Array.isArray(colors) && colors.length === geometry.attributes.position.count * 3
      ? colors
      : null;
  if (colorAttr) {
    geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(colorAttr), 3),
    );
  }

  // Pattern layer (white base + stamped patterns), same texture the live pot
  // uses. Applied as `map` and multiplied by the vertex colors in the shader.
  const patternDataUrl =
    patterns && typeof patterns.canvasData === "string"
      ? patterns.canvasData
      : null;
  const patternTexture = patternDataUrl
    ? await promiseFromImage(patternDataUrl, (img) => {
        const texture = new THREE.Texture(img);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        return texture;
      })
    : null;

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: patternTexture,
    vertexColors: true,
    roughness: 0.92,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "clay-pot";

  return { mesh, patternTexture };
}

/**
 * Serialize the mesh as a binary GLB and return an ArrayBuffer.
 */
export async function exportGLB(mesh) {
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(
    mesh,
    { binary: true },
  );
  return result;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Download a binary GLB of the pot for the given save id.
 */
export async function downloadGLB(options) {
  const { positions, colors, patterns, id } = options;
  const { mesh, patternTexture } = await buildExportMesh({ positions, colors, patterns });
  try {
    const buffer = await exportGLB(mesh);
    triggerDownload(new Blob([buffer], { type: "model/gltf-binary" }), `clay-pot-${id}.glb`);
  } finally {
    if (patternTexture) {
      patternTexture.dispose();
    }
  }
}

function promiseFromImage(src, resolveFn) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(resolveFn(img));
    img.onerror = () => reject(new Error("Failed to load pattern texture for 3D export"));
    img.src = src;
  });
}
