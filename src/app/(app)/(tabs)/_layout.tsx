import { Tabs } from "expo-router";
import { useReducedMotion } from "react-native-reanimated";

import { BottomNavigation } from "@/components/navigation/bottom-navigation";

export default function TabsLayout() {
  const reducedMotion = useReducedMotion();
  return (
    <Tabs
      tabBar={() => <BottomNavigation />}
      screenOptions={{ headerShown: false, animation: reducedMotion ? "none" : "fade", tabBarHideOnKeyboard: true }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="alerts" />
      <Tabs.Screen name="camera" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
