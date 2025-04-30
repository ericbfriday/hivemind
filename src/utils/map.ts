function handleMapArea(
  x: number,
  y: number,
  callback: TileCallback,
  range?: number,
) {
  if (typeof range === "undefined") range = 1;

  for (let dx = -range; dx <= range; dx++) {
    if (x + dx < 0) continue;
    if (x + dx >= 50) continue;
    for (let dy = -range; dy <= range; dy++) {
      // Clamp to map boundaries.
      if (y + dy < 0) continue;
      if (y + dy >= 50) continue;
      if (callback(x + dx, y + dy) === false) return;
    }
  }
}

export { handleMapArea };
