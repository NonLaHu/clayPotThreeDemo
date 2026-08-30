// Real-world measurement helpers for the clay pot.
//
// Convention (user-confirmed): 1 scene unit = 10 cm.
//  - Initial pot (2 units)  = 20 cm tall
//  - Max height (4 units)   = 40 cm tall
//  - Outer radius 0.7 units = 7 cm radius  -> 14 cm diameter
//
// All distances below are returned in scene units; convert to cm/inches with
// the numeric helpers.

export const CM_PER_UNIT = 10;
export const INCHES_PER_CM = 1 / 2.54;

export function unitsToCm(units) {
  return units * CM_PER_UNIT;
}

export function unitsToIn(units) {
  return unitsToCm(units) * INCHES_PER_CM;
}

// "20.0 cm · 7.9 in"
export function formatUnits(units, decimals = 1) {
  const cm = unitsToCm(units).toFixed(decimals);
  const inch = unitsToIn(units).toFixed(decimals);
  return `${cm} cm · ${inch} in`;
}

// Reads positions from either a Float32Array / Array of [x,y,z] triples, or a
// THREE.BufferGeometry (uses its 'position' attribute).
function iterPositions(input) {
  if (!input) {
    return null;
  }

  if (typeof input.getAttribute === "function") {
    const attr = input.getAttribute("position");
    if (!attr) {
      return null;
    }
    return { array: attr.array, count: attr.count };
  }

  if (ArrayBuffer.isView(input) || Array.isArray(input)) {
    return { array: input, count: Math.floor(input.length / 3) };
  }

  return null;
}

// Computes pot measurements from vertex positions (scene units):
//  - height                 : maxY - minY
//  - maxDiameter             : 2 x max radius across all vertices
//  - maxRadius               : the max |x,z| radius
//  - baseDiameter            : 2 x max radius in the lowest ~9% vertical band
//  - rimDiameter             : 2 x max radius in the highest ~9% vertical band
export function measurePot(input) {
  const pos = iterPositions(input);

  if (!pos) {
    return {
      height: 0,
      maxDiameter: 0,
      maxRadius: 0,
      baseDiameter: 0,
      rimDiameter: 0,
    };
  }

  const { array, count } = pos;

  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < count; i++) {
    const y = array[i * 3 + 1];
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  if (!isFinite(minY) || !isFinite(maxY) || maxY < minY) {
    return {
      height: 0,
      maxDiameter: 0,
      maxRadius: 0,
      baseDiameter: 0,
      rimDiameter: 0,
    };
  }

  const height = maxY - minY;
  const band = height * 0.09; // top/bottom 9% captures rim / base rings

  let maxRadius = 0;
  let baseRadius = 0;
  let rimRadius = 0;

  for (let i = 0; i < count; i++) {
    const x = array[i * 3];
    const y = array[i * 3 + 1];
    const z = array[i * 3 + 2];

    const r = Math.hypot(x, z);

    if (r > maxRadius) maxRadius = r;

    if (y <= minY + band && r > baseRadius) {
      baseRadius = r;
    }

    if (y >= maxY - band && r > rimRadius) {
      rimRadius = r;
    }
  }

  return {
    height,
    maxDiameter: maxRadius * 2,
    maxRadius,
    baseDiameter: baseRadius * 2,
    rimDiameter: rimRadius * 2,
  };
}
