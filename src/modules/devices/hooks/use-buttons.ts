import { useCallback } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useButtonStatusStore } from "../store/button-status.store";

export function useButtons() {
  const user = useAuthStore((state) => state.user);
  const state = useButtonStatusStore();
  const refresh = useCallback(() => user ? useButtonStatusStore.getState().load(user) : Promise.resolve(), [user]);
  useFocusEffect(useCallback(() => {
    if (!user) return;
    const check = () => { if (AppState.currentState === "active") void refresh(); };
    check();
    const listener = AppState.addEventListener("change", check);
    const timer = setInterval(check, 15_000);
    return () => { clearInterval(timer); listener.remove(); };
  }, [user, refresh]));
  const owned = !!user && state.uid === user.uid;
  return {
    buttons: owned ? state.buttons : [],
    buttonsLoading: !!user && (!owned || state.loading && state.supported === null),
    buttonsSupported: owned ? state.supported : null,
    buttonsError: owned ? state.error : null,
    refresh,
  };
}
