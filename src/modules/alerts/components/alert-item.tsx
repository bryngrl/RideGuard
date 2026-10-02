import { Pressable, Text, View } from "react-native";

import CheckCircleIcon from "@/assets/icons/alerts/circle-check.svg";
import ClockIcon from "@/assets/icons/misc/clock.svg";

import { useTheme } from "@/shared/hooks/use-theme";
import { BrandColors, Typography } from "@/shared/theme";
import type { AlertItem as AlertItemType } from "../types/alert.types";
import { styles } from "./alert-item.styles";

interface AlertItemProps {
  alert: AlertItemType;
  onPress: (alert: AlertItemType) => void;
}

const SEVERITY_CONFIG: Record<
  AlertItemType["severity"],
  { label: string; labelColor?: string }
> = {
  clear: {
    label: "All clear",
  },
  threat: {
    label: "Threat detected",
    labelColor: BrandColors.error,
  },
};

export function AlertItem({ alert, onPress }: AlertItemProps) {
  const theme = useTheme();

  const config = SEVERITY_CONFIG[alert.severity];

  const labelColor =
    alert.severity === "threat" ? BrandColors.error : theme.text;

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
        accessibilityLabel={`${config.label}, ${alert.time}`}
      >
        {/* left icon */}
        <View style={styles.iconWrapper}>
          <View style={[styles.iconPlaceholder, { borderColor: theme.border }]}>
            <CheckCircleIcon height={28} width={28} />
          </View>
        </View>

        {/* label + time */}
        <View style={styles.textBlock}>
          <Text
            style={[Typography.medium, styles.label, { color: labelColor }]}
            numberOfLines={1}
          >
            {config.label}
          </Text>

          <Text
            style={[
              Typography.medium,
              styles.timeRange,
              { color: theme.textInactive },
            ]}
            numberOfLines={1}
          >
            {alert.time}
          </Text>

          {alert.subLabel ? (
            <Text
              style={[
                Typography.bodySmall,
                styles.subLabel,
                { color: theme.text },
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
