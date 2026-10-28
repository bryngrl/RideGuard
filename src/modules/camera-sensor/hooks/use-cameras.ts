import { useCallback } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useCameraStatusStore } from "../store/camera-status.store";

/** Both screens observe the same backend data; only the focused screen polls. */
export function useCameras() {
  const user = useAuthStore((state) => state.user);
  const state = useCameraStatusStore();
  const refresh = useCallback(() => user ? useCameraStatusStore.getState().load(user) : Promise.resolve(), [user]);
  useFocusEffect(useCallback(() => {
    if (!user) return;
    const check = () => { if (AppState.currentState === "active") void refresh(); };
    check();
    const subscription = AppState.addEventListener("change", check);
    const timer = setInterval(check, 15_000);
    return () => { clearInterval(timer); subscription.remove(); };
  }, [user, refresh]));
  const owned = !!user && state.uid === user.uid;
  return {
    cameras: owned ? state.cameras : [],
    isLoading: !!user && (!owned || state.loading && state.cameras.length === 0),
    error: owned ? state.error : null,
    refresh,
  };
}
