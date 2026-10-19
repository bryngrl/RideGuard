import { Stack } from "expo-router";

import { MpinAppGate } from "@/modules/mpin/components/mpin-app-gate";

export default function AppLayout() {
  return <MpinAppGate><Stack screenOptions={{ headerShown: false }} /></MpinAppGate>;
}
