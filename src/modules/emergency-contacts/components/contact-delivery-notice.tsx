import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";

export function ContactDeliveryNotice() {
  const theme = useTheme();

  return (
    <View
      accessible
      accessibilityLabel="Emergency contact privacy notice. This contact will receive SOS status and location information by SMS and email."
      style={[
        styles.container,
        {
          backgroundColor: theme.infoBackground,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.background }]}>
        <Ionicons name="shield-checkmark-outline" size={18} color={theme.accent} />
      </View>
      <View style={styles.copy}>
        <Text style={[Typography.medium, styles.title, { color: theme.text }]}>
          How this contact is notified
        </Text>
        <Text style={[Typography.bodySmall, { color: theme.textSecondary }]}>
          This contact will receive SOS status updates by SMS and email. Email may include the rider&apos;s location and map link.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.two,
    padding: Spacing.three,
  },
  copy: {
    flex: 1,
    gap: Spacing.one,
  },
  icon: {
    alignItems: "center",
    borderRadius: 18,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
  },
});
