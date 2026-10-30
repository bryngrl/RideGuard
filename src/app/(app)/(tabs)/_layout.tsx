import { Tabs } from "expo-router";

import { BottomNavigation, type BottomNavigationProps } from "@/components/navigation/bottom-navigation";

const renderTabBar = (props: BottomNavigationProps) => <BottomNavigation {...props} />;

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={renderTabBar}
      screenOptions={{ headerShown: false, animation: "none", tabBarHideOnKeyboard: true }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="alerts" />
      <Tabs.Screen name="camera" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
