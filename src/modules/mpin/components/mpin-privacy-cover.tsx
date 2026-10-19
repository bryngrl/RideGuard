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
  if (!hidden || !authenticated) return null;
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, zIndex: 9999 }]}
    accessibilityViewIsModal accessible accessibilityLabel="RideGuard is in the background" />;
}
