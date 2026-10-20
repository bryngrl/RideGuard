import { Stack } from "expo-router";
import { useReducedMotion } from "react-native-reanimated";

import { MpinAppGate } from "@/modules/mpin/components/mpin-app-gate";

export default function AppLayout() {
  const reducedMotion = useReducedMotion();
  return <MpinAppGate><Stack screenOptions={{ headerShown: false, animation: reducedMotion ? "none" : "slide_from_right", animationDuration: 260 }} /></MpinAppGate>;
}
