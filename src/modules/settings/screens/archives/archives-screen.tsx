import ArchiveIcon from "@/assets/icons/settings/archive.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { SettingsPageLayout } from "@/modules/settings/components/settings-page-layout";
import { StyleSheet, Text, View } from "react-native";

// The archive collection and record types are not yet exposed by the API.
export function ArchivesScreen() {
  const colors = useTheme();
  return (
    <SettingsPageLayout title="Archives" contentStyle={styles.content}>
      <Text style={[Typography.body, { color: colors.textMuted }]}>
        View previously archived records.
      </Text>
      <View style={styles.state} accessible accessibilityLiveRegion="polite">
        <ArchiveIcon width={32} height={32} />
        <Text style={[Typography.h3, { color: colors.text }]}>Archives unavailable</Text>
        <Text style={[Typography.bodySmall, styles.detail, { color: colors.textMuted }]}>
          Archived records cannot be loaded yet. Please check again when archive access is available.
        </Text>
      </View>
    </SettingsPageLayout>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  state: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.two, paddingBottom: Spacing.six },
  detail: { textAlign: "center", maxWidth: 280 },
});
