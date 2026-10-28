import { Platform } from "react-native";
import { Spacing } from "./spacing";

export const BottomTabInset =
  Platform.select({
    ios: 50,
    android: 80,
  }) ?? 0;

export const MaxContentWidth = 800;

export const DeviceCardLayout = { width: 166, minHeight: 94, gap: Spacing.two } as const;
