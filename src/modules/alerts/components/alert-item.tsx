import { Pressable, Text, View } from "react-native";

import BothDetectedIcon from "@/assets/icons/alerts/both-detected.svg";
import NoDetectedIcon from "@/assets/icons/alerts/no-detected.svg";
import ViolenceDetectedIcon from "@/assets/icons/alerts/violence-detected.svg";
import WeaponDetectedIcon from "@/assets/icons/alerts/weapon-detected.svg";
import ClockIcon from "@/assets/icons/misc/clock.svg";

import { useTheme } from "@/shared/hooks/use-theme";
import { BrandColors, Typography } from "@/shared/theme";
import type { AlertItem as AlertItemType } from "../types/alert.types";
import { styles } from "./alert-item.styles";

interface AlertItemProps {
  alert: AlertItemType;
  onPress: (alert: AlertItemType) => void;
}

function DetectionIcon({ title }: { title: AlertItemType["title"] }) {
  if (title === "Violence and Weapon detected") {
    return <BothDetectedIcon height={35} width={35} />;
  }
  if (title === "Weapon detected") {
    return <WeaponDetectedIcon height={35} width={35} />;
  }
  if (title === "Violence detected") {
    return <ViolenceDetectedIcon height={35} width={35} />;
  }
  return <NoDetectedIcon height={35} width={35} />;
}

export function AlertItem({ alert, onPress }: AlertItemProps) {
  const theme = useTheme();

  const labelColor =
    alert.title === "No detections" ? BrandColors.success : BrandColors.error;

  const isUnread = !alert.read;

  return (
    <View
      style={[
        styles.edgeToEdgeWrapper,
        isUnread && {
          backgroundColor: "#E7F3FF",
        },
      ]}
    >
      <Pressable
        onPress={() => onPress(alert)}
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${alert.title}, ${alert.time}`}
      >
        {/* left icon */}
        <View style={styles.iconWrapper}>
          <View style={[styles.iconPlaceholder, { borderColor: theme.border }]}>
            <DetectionIcon title={alert.title} />
          </View>
        </View>

        {/* time + label */}
        <View style={styles.textBlock}>
          <Text
            style={[Typography.medium, styles.label, { color: "#000000" }]}
            numberOfLines={1}
          >
            {alert.time}
          </Text>

          <Text
            style={[Typography.medium, styles.timeRange, { color: labelColor }]}
            numberOfLines={1}
          >
            {alert.title}
          </Text>

          {alert.subLabel ? (
            <Text
              style={[
                Typography.bodySmall,
                styles.subLabel,
                { color: "#0046CE" },
              ]}
              numberOfLines={1}
            >
              {alert.subLabel}
            </Text>
          ) : null}
        </View>

        {/* right-side status indicator */}
        <View style={styles.statusDot}>
          {alert.pending ? (
            <ClockIcon height={20} width={20} />
          ) : isUnread ? (
            <View style={[styles.unreadDot, { backgroundColor: "#0064D1" }]} />
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}
