import { useEffect } from "react";
import { AppState } from "react-native";
import { useSegments } from "expo-router";

import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useMpinStore } from "../store/mpin.store";
import { mpinApi, type MpinStatusContext } from "../services/mpin.api";
import { createMpinSessionChecker } from "../services/mpin-session";

export function useMpinLifecycle() {
  const segments = useSegments();
  const inMpin = segments.some((segment) => segment === "(mpin)" || segment === "mpin");
  useEffect(() => {
    const checker = createMpinSessionChecker();
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    const check = (context: MpinStatusContext = { reason: "launch" }) => {
      const { user, isDemo, isCheckingAuth, isOldUser } = useAuthStore.getState();
      if (mpinApi.enabled && user && !isDemo && !isCheckingAuth && isOldUser === true && AppState.currentState === "active") {
        void checker.check(user, context);
      }
    };
    const scheduleExpiry = () => {
      clearTimeout(expiryTimer);
      const state = useMpinStore.getState();
      const expiry = state.status?.unlockExpiresAt;
      if (expiry === undefined || !state.unlocked || state.checkingStatus) return;
      expiryTimer = setTimeout(() => {
        useMpinStore.getState().beginStatusCheck();
        check({ reason: "expiry" });
      }, Math.min(Math.max(0, expiry - Date.now()), 2147483647));
    };
    const update = () => {
      const { user, isDemo } = useAuthStore.getState();
      const owner = user?.uid ?? (isDemo ? "demo-preview" : null);
      if (owner !== useMpinStore.getState().owner) checker.cancel();
      useMpinStore.getState().setOwner(owner);
      if (!useMpinStore.getState().status) check();
    };
    update();
    const unsubscribeAuth = useAuthStore.subscribe(update);
    const unsubscribeMpin = useMpinStore.subscribe(scheduleExpiry);
    scheduleExpiry();
    let backgrounded = AppState.currentState === "background";
    let backgroundAt = backgrounded ? Date.now() : null;
    const appState = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        checker.cancel(); clearTimeout(expiryTimer);
        useMpinStore.getState().clearFlow();
      }
      if (state === "background") {
        backgrounded = true;
        backgroundAt = Date.now();
        if (mpinApi.enabled && useMpinStore.getState().owner) useMpinStore.getState().lock();
      }
      if (state === "active") {
        if (backgrounded || useMpinStore.getState().checkingStatus) {
          backgrounded = false;
          check({ reason: "resume", inactiveForMs: backgroundAt === null ? 0 : Math.max(0, Date.now() - backgroundAt) });
          backgroundAt = null;
        }
        else scheduleExpiry();
      }
    });
    return () => {
      checker.cancel(); clearTimeout(expiryTimer);
      unsubscribeAuth(); unsubscribeMpin(); appState.remove(); useMpinStore.getState().reset();
    };
  }, []);
  useEffect(() => {
    if (!inMpin) useMpinStore.getState().clearFlow();
  }, [inMpin]);
}
