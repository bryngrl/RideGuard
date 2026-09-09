import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import HomeActiveIcon from "@/assets/icons/navigation-icons/active-home.svg";
import HomeInactiveIcon from "@/assets/icons/navigation-icons/inactive-home.svg";

import AlertActiveIcon from "@/assets/icons/navigation-icons/active-alerts.svg";
import AlertInactiveIcon from "@/assets/icons/navigation-icons/inactive-alerts.svg";

import CameraActiveIcon from "@/assets/icons/navigation-icons/active-camera.svg";
import CameraInactiveIcon from "@/assets/icons/navigation-icons/inactive-camera.svg";

import SettingActiveIcon from "@/assets/icons/navigation-icons/active-settings.svg";
import SettingInactiveIcon from "@/assets/icons/navigation-icons/inactive-settings.svg";

type Tab = {
  label: string;
  route: string;
  ActiveIcon: React.ComponentType<{
    width?: number;
    height?: number;
  }>;
  InactiveIcon: React.ComponentType<{
    width?: number;
    height?: number;
  }>;
};

const tabs: Tab[] = [
  {
    label: "Home",
    route: "/(tabs)",
    ActiveIcon: HomeActiveIcon,
    InactiveIcon: HomeInactiveIcon,
  },
  {
    label: "Alerts",
    route: "/alerts",
    ActiveIcon: AlertActiveIcon,
    InactiveIcon: AlertInactiveIcon,
  },
  {
    label: "Camera",
    route: "/camera",
    ActiveIcon: CameraActiveIcon,
    InactiveIcon: CameraInactiveIcon,
  },
  {
    label: "Settings",
    route: "/settings",
    ActiveIcon: SettingActiveIcon,
    InactiveIcon: SettingInactiveIcon,
  },
];

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const colors = useTheme();

  const handleNavigation = (route: string) => {
    router.push(route as never);
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive =
            tab.label === "Home"
              ? pathname === "/" || pathname === "/(tabs)"
              : pathname === tab.route;

          const Icon = isActive ? tab.ActiveIcon : tab.InactiveIcon;

          const color = isActive ? colors.primary : colors.textInactive;

          return (
            <Pressable
              key={tab.label}
              style={({ pressed }) => [
                styles.tab,
                pressed && styles.tabPressed,
              ]}
              onPress={() => handleNavigation(tab.route)}
            >
              <Icon width={24} height={24} />

              <Text
                style={[
                  styles.label,
                  {
                    color,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },

  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderWidth: 1,
    borderRadius: 9999,

    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",

    gap: Spacing.one,

    paddingVertical: Spacing.one,
  },

  tabPressed: {
    opacity: 0.7,
  },

  label: {
    ...Typography.bodySmall,
    textAlign: "center",
  },
});
