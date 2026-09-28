import { Tabs } from "expo-router";

import { BottomNavigation } from "@/shared/ui/bottom-navigation";

// Hosts the shared bottom navigation bar once for all tab screens. Each tab
// screen only renders its own content; the bar lives here and persists across
// tab switches.
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => <BottomNavigation />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="alerts" />
      <Tabs.Screen name="camera" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
