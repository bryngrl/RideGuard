import { Spacing } from "./spacing";

// Edit Contact's resting gap: 32 px page padding + 8 px action padding.
export const ActionFooterBottomSpace = Spacing.five + Spacing.two;

/** Match that gap without adding the navigation-bar inset twice. */
export function actionFooterPadding(bottomInset: number, safeAreaIncludesBottom = false) {
  const inset = Math.max(0, bottomInset);
  const total = Math.max(ActionFooterBottomSpace, inset + Spacing.two);
  return total - (safeAreaIncludesBottom ? inset : 0);
}
