import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";

export function ArchivesEmptyState({ error, refreshing, onRetry, onViewAlerts }: {
  error?: string | null;
  refreshing: boolean;
  onRetry: () => void;
  onViewAlerts: () => void;
}) {
  const theme = useTheme();
  return <View style={styles.container}>
    <View style={[styles.illustration, { backgroundColor: theme.infoBackground }]}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Ionicons name={error ? "cloud-offline-outline" : "archive-outline"} size={48} color={theme.primary} />
      {!error && <View style={[styles.badge, { backgroundColor: theme.background, borderColor: theme.infoBackground }]}>
        <Ionicons name="shield-checkmark-outline" size={20} color={theme.accent} />
      </View>}
    </View>
    <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
      {error ? "Couldn't load archives" : "No archives yet"}
    </Text>
    <Text style={[styles.description, { color: theme.textSecondary }]}>
      {error ? "Check your connection and try again." : "Alerts you archive will appear here, keeping your alert history organized and easy to find."}
    </Text>
    <Button title={error ? "Try again" : "View alerts"} variant="outline" fullWidth={false}
      disabled={!!error && refreshing} onPress={error ? onRetry : onViewAlerts} style={styles.action} />
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 360, alignItems: "center", justifyContent: "center", paddingVertical: Spacing.six, paddingHorizontal: Spacing.four },
  illustration: { width: 112, height: 112, borderRadius: BorderRadius.full, alignItems: "center", justifyContent: "center", marginBottom: Spacing.four },
  badge: { position: "absolute", bottom: 0, right: 0, width: 36, height: 36, borderRadius: BorderRadius.full, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  title: { ...Typography.h3, textAlign: "center" },
  description: { ...Typography.body, textAlign: "center", marginTop: Spacing.two, maxWidth: 300 },
  action: { marginTop: Spacing.four, minWidth: 148 },
});
