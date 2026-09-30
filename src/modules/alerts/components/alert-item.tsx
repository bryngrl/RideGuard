import { Pressable, Text, View } from "react-native";

import CheckCircleIcon from "@/assets/icons/alerts/circle-check.svg";
import ClockIcon from "@/assets/icons/misc/clock.svg";

import { useTheme } from "@/shared/hooks/use-theme";
import { BrandColors, Typography } from "@/shared/theme";
import type { Alert, AlertSeverity } from "../types/alert.types";
import { styles } from "./alert-item.styles";

interface AlertItemProps {
  alert: Alert;
  onPress: (alert: Alert) => void;
}

/** Maps severity to display label and accent color */
const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { label: string; labelColor?: string }
> = {
  all_clear: {
    label: "All clear",
  },
  possible_threat: {
    label: "Possible threat",
    labelColor: BrandColors.error,
  },
  metal_detected: {
    label: "Metal object detected",
  },
};

export function AlertItem({ alert, onPress }: AlertItemProps) {
  const theme = useTheme();

  const config = SEVERITY_CONFIG[alert.severity];

  const labelColor =
    alert.severity === "possible_threat" ? BrandColors.error : theme.text;

  const isFalseAlarm = alert.status === "false_alarm";
  const isPending = alert.status === "pending";
  const isUnread = !alert.isRead;

  return (
    <Pressable
      onPress={() => onPress(alert)}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${config.label}, ${alert.timeRange}`}
    >
      <View style={styles.iconWrapper}>
        <View style={[styles.iconPlaceholder, { borderColor: theme.border }]}>
          <CheckCircleIcon height={28} width={28} />
        </View>
      </View>

      {/* label + time range + optional sub-label*/}
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
          {alert.timeRange}
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

      {/* unread dot OR pending clock icon */}
      <View style={styles.statusDot}>
        {isPending ? (
          <View style={[styles.pendingCircle, { borderColor: theme.border }]}>
            <ClockIcon width={18} height={18} color={theme.text} />
          </View>
        ) : isUnread || isFalseAlarm ? (
          <View
            style={[
              styles.unreadDot,
              {
                backgroundColor:
                  alert.severity === "possible_threat"
                    ? BrandColors.error
                    : BrandColors.primary,
              },
            ]}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
