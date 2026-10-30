import { Stack } from "expo-router";
import { useEffect } from "react";
import { useReducedMotion } from "react-native-reanimated";

import { MpinAppGate } from "@/modules/mpin/components/mpin-app-gate";
import { useSosLifecycle } from "@/modules/sos/hooks/use-sos-lifecycle";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useSettingsStore } from "@/modules/settings/store/settings.store";

export default function AppLayout() {
  useSosLifecycle();
  const uid = useAuthStore((state) => state.user?.uid);
  const loadAutoArchive = useSettingsStore((state) => state.loadAutoArchive);
  useEffect(() => {
    if (uid) void loadAutoArchive();
  }, [uid, loadAutoArchive]);
  const reducedMotion = useReducedMotion();
  return <MpinAppGate><Stack screenOptions={{ headerShown: false, animation: reducedMotion ? "none" : "slide_from_right", animationDuration: 260 }} /></MpinAppGate>;
}
