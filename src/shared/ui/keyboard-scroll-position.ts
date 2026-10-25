export type KeyboardScrollGeometry = {
  fieldTop: number;
  fieldHeight: number;
  viewportTop: number;
  viewportHeight: number;
  keyboardTop: number | null;
  gap: number;
  scrollY: number;
  contentHeight: number;
};

/** Compute a scroll target from coordinates measured in the same window. */
export function keyboardScrollPosition(geometry: KeyboardScrollGeometry) {
  const {
    fieldTop, fieldHeight, viewportTop, viewportHeight, keyboardTop,
    gap, scrollY, contentHeight,
  } = geometry;
  const viewportBottom = viewportTop + viewportHeight;
  const visibleBottom = Math.min(viewportBottom, keyboardTop ?? viewportBottom);
  const overlap = Math.max(0, Math.ceil(viewportBottom - visibleBottom));
  const bottomDelta = fieldTop + fieldHeight - (visibleBottom - gap);
  const topDelta = fieldTop - (viewportTop + gap);
  const delta = bottomDelta > 1 ? bottomDelta : topDelta < -1 ? topDelta : 0;
  const maxScroll = Math.max(0, contentHeight - viewportHeight);
  const target = Math.max(0, Math.min(maxScroll, scrollY + delta));
  return { overlap, target };
}
