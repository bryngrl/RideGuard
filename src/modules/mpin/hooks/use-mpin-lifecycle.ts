import { useEffect } from "react";
import { AppState } from "react-native";
import { useSegments } from "expo-router";

import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useMpinStore } from "../store/mpin.store";
import { mpinApi, type MpinStatusContext } from "../services/mpin.api";
import { createMpinSessionChecker } from "../services/mpin-session";
import { MPIN_BACKGROUND_LOCK_MS } from "../utils/mpin-policy";
import { BrandedAlert } from "@/shared/lib/branded-alert";
import { AppSecurity } from "../../../../modules/app-security";
import { notifyMpinLock, subscribeMpinActivity } from "../services/mpin-activity";

export function useMpinLifecycle() {
  const segments = useSegments();
  const inMpin = segments.some((segment) => segment === "(mpin)" || segment === "mpin");
  useEffect(() => {
    const checker = createMpinSessionChecker();
    const clock = () => typeof performance !== "undefined" ? performance.now() : Date.now();
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let noticeTimer: ReturnType<typeof setTimeout> | undefined;
    let lastActivity = clock();
    let previouslyUnlocked = false;
    let screenLockPending = false;
    let screenOffCount: number | null = null;
    const check = (context: MpinStatusContext = { reason: "launch" }) => {
      const { user, isDemo, isCheckingAuth, isOldUser } = useAuthStore.getState();
      if (mpinApi.enabled && user && !isDemo && !isCheckingAuth && isOldUser === true && AppState.currentState === "active") {
        void checker.check(user, context);
      }
    };
    const showNotice = (owner: string | null) => {
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => {
        const current = useMpinStore.getState();
        if (!owner || AppState.currentState !== "active" || current.owner !== owner || !current.requiresLocalUnlock) return;
        BrandedAlert.alert("Session locked", "RideGuard locked after 3 minutes of inactivity. Enter your MPIN to continue.",
          [{ text: "Continue" }], { cancelable: false });
      }, 0);
    };
    const scheduleIdle = () => {
      const current = useMpinStore.getState();
      if (idleTimer !== undefined || AppState.currentState !== "active" || !mpinApi.enabled || !current.unlocked) return;
      idleTimer = setTimeout(() => {
        idleTimer = undefined;
        if (AppState.currentState !== "active" || !useMpinStore.getState().unlocked) return;
        if (clock() - lastActivity < MPIN_BACKGROUND_LOCK_MS) { scheduleIdle(); return; }
        checker.cancel();
        BrandedAlert.clear();
        const owner = useMpinStore.getState().owner;
        useMpinStore.getState().lock(true);
        showNotice(owner);
        check({ reason: "expiry", inactiveForMs: MPIN_BACKGROUND_LOCK_MS, forceUnlock: true });
      }, Math.max(0, MPIN_BACKGROUND_LOCK_MS - (clock() - lastActivity)));
    };
    const inspectDevice = () => {
      if (!AppSecurity) return;
      try {
        const device = AppSecurity.getScreenState();
        const screenTurnedOff = screenOffCount !== null && screenOffCount !== device.screenOffCount;
        screenOffCount = device.screenOffCount;
        if (screenTurnedOff || device.locked || !device.interactive) {
          screenLockPending = true;
          if (useMpinStore.getState().unlocked) useMpinStore.getState().lock(true);
        }
      } catch {
        screenLockPending = true;
        if (useMpinStore.getState().unlocked) useMpinStore.getState().lock(true);
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
    const unsubscribeMpin = useMpinStore.subscribe(() => {
      const unlocked = useMpinStore.getState().unlocked;
      const wasUnlocked = previouslyUnlocked;
      previouslyUnlocked = unlocked;
      if (wasUnlocked && !unlocked) { notifyMpinLock(); BrandedAlert.clear(); }
      if (unlocked && !wasUnlocked) lastActivity = clock();
      if (!unlocked) { clearTimeout(idleTimer); idleTimer = undefined; }
      scheduleExpiry(); scheduleIdle();
    });
    const unsubscribeActivity = subscribeMpinActivity(() => {
      if (AppState.currentState !== "active" || !useMpinStore.getState().unlocked) return;
      lastActivity = clock(); scheduleIdle();
    });
    inspectDevice();
    // Read current state, not a potentially delayed screen-off event payload.
    const screenListener = AppSecurity?.addListener("onScreenState", inspectDevice);
    scheduleExpiry();
    // Monotonic time prevents a manual wall-clock change shortening the lock.
    let backgrounded = AppState.currentState === "background";
    let backgroundAt = backgrounded ? clock() : null;
    let backgroundOwner: string | null = null;
    let wasUnlocked = false;
    const appState = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        clearTimeout(noticeTimer);
        clearTimeout(idleTimer); idleTimer = undefined;
        checker.cancel(); clearTimeout(expiryTimer);
        useMpinStore.getState().suspendFlow(true);
      }
      if (state === "background" && !backgrounded) {
        backgrounded = true;
        backgroundAt = clock();
        const current = useMpinStore.getState();
        backgroundOwner = current.owner;
        wasUnlocked = current.unlocked && !current.requiresLocalUnlock;
      }
      if (state === "active") {
        inspectDevice();
        if (backgrounded || useMpinStore.getState().checkingStatus || screenLockPending) {
          const inactiveForMs = backgroundAt === null ? 0 : Math.max(0, clock() - backgroundAt);
          if (backgrounded && !screenLockPending && inactiveForMs >= MPIN_BACKGROUND_LOCK_MS && mpinApi.enabled && useMpinStore.getState().owner) {
            useMpinStore.getState().lock(true);
            const owner = useMpinStore.getState().owner;
            if (wasUnlocked && owner === backgroundOwner) {
              showNotice(owner);
            }
          }
          backgrounded = false;
          check({ reason: "resume", inactiveForMs, forceUnlock: screenLockPending });
          screenLockPending = false;
          lastActivity = clock();
          backgroundAt = null;
          wasUnlocked = false;
        }
        else scheduleExpiry();
        scheduleIdle();
      }
    });
    return () => {
      checker.cancel(); clearTimeout(expiryTimer); clearTimeout(noticeTimer); clearTimeout(idleTimer);
      unsubscribeAuth(); unsubscribeMpin(); unsubscribeActivity(); screenListener?.remove(); appState.remove(); useMpinStore.getState().reset();
    };
  }, []);
  useEffect(() => {
    if (!inMpin) useMpinStore.getState().clearFlow();
  }, [inMpin]);
}
