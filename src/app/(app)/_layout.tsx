import { Stack } from "expo-router";
import { useReducedMotion } from "react-native-reanimated";

import { MpinAppGate } from "@/modules/mpin/components/mpin-app-gate";
import { useSosLifecycle } from "@/modules/sos/hooks/use-sos-lifecycle";

export default function AppLayout() {
  useSosLifecycle();
  const reducedMotion = useReducedMotion();
  return <MpinAppGate><Stack screenOptions={{ headerShown: false, animation: reducedMotion ? "none" : "slide_from_right", animationDuration: 260 }} /></MpinAppGate>;
}
