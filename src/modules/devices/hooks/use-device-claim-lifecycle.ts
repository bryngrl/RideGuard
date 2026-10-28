import { auth } from "@/lib/firebase";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { AppState } from "react-native";
import { createDeviceClaimLifecycle } from "../services/device-claim-lifecycle";

export function useDeviceClaimLifecycle(onResume?: () => void) {
  const resume = useRef(onResume);
  resume.current = onResume;
  const ref = useRef<ReturnType<typeof createDeviceClaimLifecycle> | null>(null);
  if (!ref.current) ref.current = createDeviceClaimLifecycle(() => auth.currentUser?.uid ?? null);
  const lifecycle = ref.current;
  useFocusEffect(useCallback(() => {
    if (AppState.currentState === "active") lifecycle.activate();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") lifecycle.cancel();
      else {
        lifecycle.activate();
        resume.current?.();
      }
    });
    return () => { subscription.remove(); lifecycle.cancel(); };
  }, [lifecycle]));
  return lifecycle;
}
