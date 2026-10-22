import { Ionicons } from "@expo/vector-icons";
import { Spacing } from "@/shared/theme";

export const BACK_ARROW_ICON_SIZE = 22;
export const BACK_ARROW_TOUCH_SIZE = 48;
// Center the icon while keeping its left edge on the 24px content grid.
export const BACK_ARROW_TOUCH_LEFT = Spacing.four - (BACK_ARROW_TOUCH_SIZE - BACK_ARROW_ICON_SIZE) / 2;

export function BackArrowIcon({ color }: { color: string }) {
  return <Ionicons name="chevron-back" size={BACK_ARROW_ICON_SIZE} color={color} style={{ width: BACK_ARROW_ICON_SIZE, textAlign: "center" }} />;
}
