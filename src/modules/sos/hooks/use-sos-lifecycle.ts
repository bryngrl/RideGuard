import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { useFocusEffect, useSegments } from "expo-router";
import { hasPending } from "../types";
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
      if (state === "background") sosStore.getState().cancelCountdown();
      if (state === "active") void sosStore.getState().refresh();
    });
    return () => { subscription.remove(); sosStore.getState().cancelCountdown(); };
  }, []);
}

export function useSosStatus(ready: boolean, contacts = false) {
  useFocusEffect(useCallback(() => {
    if (!ready) return;
    if (contacts) void sosStore.getState().loadContacts();
    void sosStore.getState().refresh();
    const timer = setInterval(() => {
      const state = sosStore.getState();
      if (state.foreground && (hasPending(state.record) || state.phase === "checking")) void state.refresh();
    }, 5000);
    return () => clearInterval(timer);
  }, [ready, contacts]));
}
