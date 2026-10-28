import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { Text, View } from "react-native";

import BothDetectedIcon from "@/assets/icons/alerts/both-detected.svg";
import NoDetectedIcon from "@/assets/icons/alerts/no-detected.svg";
import ViolenceDetectedIcon from "@/assets/icons/alerts/violence-detected.svg";
import WeaponDetectedIcon from "@/assets/icons/alerts/weapon-detected.svg";
import ClockIcon from "@/assets/icons/misc/clock.svg";

import { useTheme } from "@/shared/hooks/use-theme";
import { Typography } from "@/shared/theme";
import { getAlertDetectionType } from "../services/alerts.mapper";
import type { AlertItem as AlertItemType } from "../types/alert.types";
import { styles } from "./alert-item.styles";

interface AlertItemProps {
  alert: AlertItemType;
  onPress: (alert: AlertItemType) => void;
}

function DetectionIcon({ title }: { title: AlertItemType["title"] }) {
  const detectionType = getAlertDetectionType(title);

  if (detectionType === "both") {
    return <BothDetectedIcon height={35} width={35} />;
  }
  if (detectionType === "weapon") {
    return <WeaponDetectedIcon height={35} width={35} />;
  }
  if (detectionType === "violence") {
    return <ViolenceDetectedIcon height={35} width={35} />;
  }
  return <NoDetectedIcon height={35} width={35} />;
}

export function AlertItem({ alert, onPress }: AlertItemProps) {
  const theme = useTheme();

  const labelColor =
    getAlertDetectionType(alert.title) === "none"
      ? theme.success
      : theme.error;

  const isUnread = !alert.read;

  return (
    <View
      style={[
        styles.edgeToEdgeWrapper,
        isUnread && {
          backgroundColor: theme.unreadBackground,
        },
      ]}
    >
      <Pressable
        onPress={() => onPress(alert)}
        style={styles.container}
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
          <View style={styles.timeRow}>
            <Text
              style={[Typography.medium, styles.label, { color: theme.text }]}
            >
              {alert.time}
            </Text>
            {alert.manual ? (
              <View style={[styles.manualBadge, { borderColor: theme.primary }]}>
                <Text style={[styles.manualBadgeText, { color: theme.primary }]}>Manual</Text>
              </View>
            ) : null}
          </View>

          <Text
            style={[Typography.bodySmall, styles.timeRange, { color: labelColor }]}
            numberOfLines={1}
          >
            {alert.title}
          </Text>

          {alert.subLabel ? (
            <Text
              style={[
                Typography.bodySmall,
                styles.subLabel,
                { color: theme.accent },
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
            <ClockIcon height={16} width={16} />
          ) : isUnread ? (
            <View style={[styles.unreadDot, { backgroundColor: theme.unreadDot }]} />
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}
