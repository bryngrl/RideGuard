import { Tabs } from "expo-router";

import { BottomNavigation } from "@/components/navigation/bottom-navigation";

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
