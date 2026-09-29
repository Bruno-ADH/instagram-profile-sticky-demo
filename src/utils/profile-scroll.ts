export function synchronizedOffset(sourceY: number, savedY: number, collapsePoint: number) {
  'worklet';
  return sourceY < collapsePoint ? sourceY : Math.max(savedY, collapsePoint);
}

// PhotoCell is square. Fill the space below short grids so every page can
// collapse the whole profile, including an empty or failed initial feed.
export function minimumGridFooter(
  photoCount: number, width: number, height: number, tabHeight: number, columns: number,
) {
  const gridHeight = Math.ceil(photoCount / columns) * (width / columns);
  return Math.max(0, Math.ceil(height - tabHeight - gridHeight));
}
