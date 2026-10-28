import { useEffect, useState } from "react";
import { AppState, StyleSheet, View } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useTheme } from "@/shared/hooks/use-theme";

/** Best-effort app-switcher privacy; native snapshot timing still needs device QA. */
export function MpinPrivacyCover() {
  const [hidden, setHidden] = useState(AppState.currentState !== "active");
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const theme = useTheme();
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => setHidden(state !== "active"));
    return () => listener.remove();
  }, []);
  const visible = hidden && authenticated;
  return <View collapsable={false} pointerEvents={visible ? "auto" : "none"}
    style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, zIndex: 9999, opacity: visible ? 1 : 0 }]}
    accessibilityElementsHidden={!visible} importantForAccessibility={visible ? "yes" : "no-hide-descendants"}
    accessibilityViewIsModal={visible} accessible={visible} accessibilityLabel="RideGuard is in the background" />;
}
