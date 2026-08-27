/**
 * Applies a saved pot state (vertex positions + colors) back onto the live
 * lathe geometry so the booth pot matches the saved work.
 */
export function restorePotFromSave(save, geometry) {
  const { positions, colors } = save;

  if (!geometry || !save) {
    return false;
  }

  const pos = geometry.attributes.position;
  const col = geometry.attributes.color;

  if (positions && Array.isArray(positions) && positions.length === pos.count * 3) {
    for (let i = 0; i < pos.count * 3; i++) {
      pos.array[i] = positions[i];
    }
    pos.needsUpdate = true;
  }

  if (colors && Array.isArray(colors) && colors.length === col.count * 3) {
    for (let i = 0; i < col.count * 3; i++) {
      col.array[i] = colors[i];
    }
    col.needsUpdate = true;
  }

  geometry.computeVertexNormals();

  return true;
}

/**
 * Captures the current pot state into a portable, persistable record.
 * `patternState` (an optional snapshot from the draw controller's pattern
 * layer) is included when provided.
 */
export function capturePotState(geometry, patternState) {
  const positions = Array.from(geometry.attributes.position.array);
  const colors = Array.from(geometry.attributes.color.array);

  const record = { positions, colors };

  if (patternState) {
    record.patterns = patternState;
  }

  return record;
}