/** Unknown counts use one row; known empty lists never invent records. */
export function skeletonRowCount(knownCount: number | undefined, visibleLimit: number) {
  const count = Number.isInteger(knownCount) && knownCount! >= 0 ? knownCount! : 1;
  return Math.min(count, Math.max(0, Math.floor(visibleLimit)));
}
