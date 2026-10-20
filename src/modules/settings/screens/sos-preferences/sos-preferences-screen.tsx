import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { SettingsPageLayout } from "@/modules/settings/components/settings-page-layout";
import { StyleSheet, Text, View } from "react-native";
import { ToggleRow } from "../../components/toggle-row";

// No preference endpoint is available in this checkout. Keep the control off
// until a server-confirmed value and update operation can be supplied.
export function SosPreferencesScreen() {
  const colors = useTheme();
  return (
    <SettingsPageLayout title="SOS Preferences" contentStyle={styles.content}>
      <Text style={[Typography.body, { color: colors.textMuted }]}>
        Manage how RideGuard responds when a possible threat is detected.
      </Text>
      <View style={[styles.setting, { borderColor: colors.border }]}>
        <ToggleRow
          title="Automatically trigger SOS"
          description="Automatically activate SOS when an eligible threat is confirmed by the system."
          value={false}
          onChange={() => undefined}
          disabled
        />
      </View>
      <Text accessibilityLiveRegion="polite" style={[Typography.bodySmall, { color: colors.textMuted }]}>
        Automatic SOS preferences are unavailable until the service can load and save your choice. Manual SOS remains available.
      </Text>
    </SettingsPageLayout>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.four },
  setting: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: Spacing.three },
});
