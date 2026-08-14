import * as THREE from "three";
import { SCULPT, CLAY_POT } from "../core/constants.js";
import { state } from "../core/state.js";

export function deformClay(geometry, clayPositions, radiusChange, heightChange) {
  if (!state.sculpt.point) {
    return;
  }

  const pos = geometry.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const ox = clayPositions[i * 3];

    const oy = clayPositions[i * 3 + 1];

    const oz = clayPositions[i * 3 + 2];

    const heightDistance = Math.abs(oy - state.sculpt.point.y);

    if (heightDistance > SCULPT.BRUSH_HEIGHT) {
      continue;
    }

    const brushStrength = 1 - heightDistance / SCULPT.BRUSH_HEIGHT;

    const radius = Math.sqrt(ox * ox + oz * oz);

    const angle = Math.atan2(oz, ox);

    const deformation = THREE.MathUtils.clamp(
      radiusChange * brushStrength * 3,
      -0.003,
      0.003,
    );

    const newRadius = radius * (1 + deformation);

    const heightScale = 1 + heightChange * brushStrength * 8;

    const newY = oy * heightScale;

    pos.setX(i, Math.cos(angle) * newRadius);

    pos.setZ(i, Math.sin(angle) * newRadius);

    pos.setY(i, THREE.MathUtils.clamp(newY, 0, CLAY_POT.MAX_HEIGHT));
  }

  pos.needsUpdate = true;

  for (let i = 0; i < pos.count * 3; i++) {
    clayPositions[i] = pos.array[i];
  }

  geometry.computeVertexNormals();
}