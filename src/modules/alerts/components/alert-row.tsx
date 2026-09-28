import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";

import { ALERT_ICON, UNREAD_BACKGROUND_COLOR } from "../constants";
import type { AlertItem } from "../types/alert.types";

interface AlertRowProps {
  alert: AlertItem;
  onPress?: () => void;
}

export function AlertRow({ alert, onPress }: AlertRowProps) {
  const colors = useTheme();

  const isThreat = alert.severity === "threat";
  const titleColor = isThreat ? colors.error : colors.text;
  const iconName = isThreat ? ALERT_ICON.THREAT : ALERT_ICON.CLEAR;
  const iconColor = isThreat ? colors.error : colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !alert.read && { backgroundColor: UNREAD_BACKGROUND_COLOR },
        pressed && styles.pressed,
      ]}
    >
      {/* LEADING ICON */}
      <Ionicons name={iconName} size={44} color={iconColor} />

      {/* TEXT */}
      <View style={styles.rowText}>
        <Text style={[Typography.h4, { color: titleColor }]}>
          {alert.title}
        </Text>
        <Text style={[Typography.bodyLarge, { color: colors.textMuted }]}>
          {alert.time}
        </Text>
      </View>

      {/* TRAILING INDICATOR */}
      <View style={styles.trailing}>
        {alert.pending ? (
          <Ionicons
            name={ALERT_ICON.PENDING}
            size={24}
            color={colors.textMuted}
          />
        ) : !alert.read ? (
          <View
            style={[styles.unreadDot, { backgroundColor: colors.accent }]}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  trailing: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
