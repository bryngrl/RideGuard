import { useEffect, useState } from "react";
import { AppState, Platform, StyleSheet, View } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useTheme } from "@/shared/hooks/use-theme";
import { hasVisibleAppModal, subscribeAppModals } from "@/shared/lib/app-modal-visibility";

/** Best-effort app-switcher privacy; native snapshot timing still needs device QA. */
export function MpinPrivacyCover() {
  const [hidden, setHidden] = useState(AppState.currentState !== "active");
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const theme = useTheme();
  useEffect(() => {
    let frame: number | null = null;
    const cancelReveal = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };
    const cover = () => { cancelReveal(); setHidden(true); };
    const reveal = () => {
      cancelReveal();
      // Keep the cover while the resume lock and its existing unlock UI commit.
      // Removing it in the same AppState event can expose the previous form.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          frame = null;
          if (AppState.currentState === "active") setHidden(false);
        });
      });
    };
    const listeners = [AppState.addEventListener("change", (state) => state === "active" ? reveal() : cover())];
    if (Platform.OS === "android") {
      // App-owned dialogs take window focus while the app remains active. Keep the
      // form visible through their translucent backdrop; real backgrounding
      // still covers it immediately through the AppState change listener.
      listeners.push(AppState.addEventListener("blur", () => {
        if (AppState.currentState !== "active" || !hasVisibleAppModal()) cover();
      }));
      listeners.push(AppState.addEventListener("focus", () => {
        if (AppState.currentState === "active") reveal();
      }));
    }
    const unsubscribeModals = subscribeAppModals(() => {
      if (hasVisibleAppModal() && AppState.currentState === "active") reveal();
    });
    return () => { cancelReveal(); unsubscribeModals(); listeners.forEach((listener) => listener.remove()); };
  }, []);
  const visible = hidden && authenticated;
  return <View collapsable={false} pointerEvents={visible ? "auto" : "none"}
    style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, zIndex: 9999, opacity: visible ? 1 : 0 }]}
    accessibilityElementsHidden={!visible} importantForAccessibility={visible ? "yes" : "no-hide-descendants"}
    accessibilityViewIsModal={visible} accessible={visible} accessibilityLabel="RideGuard is in the background" />;
}
