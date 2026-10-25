import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { useFocusEffect, useSegments } from "expo-router";
import { startStatusPolling } from "../store/sos-polling";
import { sosStore } from "../store/sos.store";

export function useSosLifecycle() {
  const segments = useSegments();
  const inSos = segments.some((segment) => segment === "sos");
  useEffect(() => {
    if (!inSos) sosStore.getState().cancelCountdown();
  }, [inSos]);
  useEffect(() => {
    sosStore.getState().setForeground(AppState.currentState === "active");
    const subscription = AppState.addEventListener("change", (state) => {
      sosStore.getState().setForeground(state === "active");
      if (state === "background") sosStore.getState().cancelCountdown("SOS preparation cancelled because the app was interrupted. No request was sent. Tap again when ready.");
    });
    return () => { subscription.remove(); sosStore.getState().cancelCountdown(); };
  }, []);
}

export function useSosStatus(ready: boolean, contacts = false) {
  useFocusEffect(useCallback(() => {
    if (!ready) return;
    sosStore.getState().setForeground(AppState.currentState === "active");
    if (contacts) void sosStore.getState().loadContacts();
    let stop = startStatusPolling(sosStore);
    const app = AppState.addEventListener("change", (state) => {
      stop();
      sosStore.getState().setForeground(state === "active");
      if (state === "active") stop = startStatusPolling(sosStore);
    });
    return () => { stop(); app.remove(); };
  }, [ready, contacts]));
}
