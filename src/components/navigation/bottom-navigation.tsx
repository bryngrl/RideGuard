import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";

import HomeActiveIcon from "@/assets/icons/navigation/active-home.svg";
import HomeInactiveIcon from "@/assets/icons/navigation/inactive-home.svg";

import AlertActiveIcon from "@/assets/icons/navigation/active-alerts.svg";
import AlertInactiveIcon from "@/assets/icons/navigation/inactive-alerts.svg";

import CameraActiveIcon from "@/assets/icons/navigation/active-camera.svg";
import CameraInactiveIcon from "@/assets/icons/navigation/inactive-camera.svg";

import SettingActiveIcon from "@/assets/icons/navigation/active-settings.svg";
import SettingInactiveIcon from "@/assets/icons/navigation/inactive-settings.svg";

type Tab = {
  label: string;
  route: string;
  ActiveIcon: React.ComponentType<{
    width?: number;
    height?: number;
    color?: string;
  }>;
  InactiveIcon: React.ComponentType<{
    width?: number;
    height?: number;
    color?: string;
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
  // Android is edge-to-edge: keep the bar above the system navigation.
  const { bottom } = useSafeAreaInsets();

  const handleNavigation = (route: string) => {
    router.navigate(route as never);
  };

  return (
    // The padding around the pill would otherwise show the navigator's grey
    // DefaultTheme background.
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.background,
          paddingBottom: bottom + Spacing.two,
        },
      ]}
    >
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
              feedbackRadius={9999}
              style={[
                styles.tab,
                isActive && {
                  backgroundColor: colors.infoBackground,
                },
              ]}
              onPress={() => handleNavigation(tab.route)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Icon width={16} height={16} color={color} />

              <Text
                style={[
                  styles.label,
                  isActive && styles.activeLabel,
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
  },

  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderWidth: 1,
    borderRadius: 9999,

    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.one,
  },

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",

    gap: Spacing.one,

    borderRadius: 9999,
    paddingVertical: Spacing.two + Spacing.half,
  },


  label: {
    ...Typography.bodySmall,
    textAlign: "center",
  },
  activeLabel: {
    fontWeight: 700,
  },
});
