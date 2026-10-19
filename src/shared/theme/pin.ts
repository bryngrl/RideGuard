import { Spacing } from "./spacing";

/** Shared proportions for every MPIN / numeric verification keypad. */
export const PinLayout = {
  indicatorWidth: 44,
  indicatorHeight: 52,
  keypadWidth: 280,
  keyHeight: 58,
  rowGap: Spacing.two,
  actionGap: Spacing.three,
  minimumContentHeight: 680,
} as const;

export function getPinKeypadGap(availableHeight: number): number {
  const contentHeight = Math.max(PinLayout.minimumContentHeight, availableHeight);
  return Math.max(32, Math.min(96, contentHeight - 696));
}
