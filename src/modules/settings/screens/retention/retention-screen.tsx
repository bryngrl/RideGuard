import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { PageLayout } from "@/shared/ui";
import { StyleSheet, Text, View } from "react-native";
import { InfoNote } from "../../components/info-note";
import { RadioOption } from "../../components/radio-option";
import { RETENTION_OPTIONS, SETTINGS_COPY } from "../../constants";
import { useSettingsStore } from "../../store/settings.store";
export function RetentionScreen() {
  const colors = useTheme();
  const value = useSettingsStore((state) => state.retention);
  const setValue = useSettingsStore((state) => state.setRetention);
  return (
    <PageLayout title="Data & footage retention" contentStyle={styles.content}>
      <Text style={[Typography.h3, { color: colors.text }]}>
        Automatic deletion
      </Text>
      <Text
        style={[
          Typography.bodySmall,
          styles.description,
          { color: colors.textMuted },
        ]}
      >
        {SETTINGS_COPY.retentionDescription}
      </Text>
      <View
        style={[
          styles.panel,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        {RETENTION_OPTIONS.map((option) => (
          <RadioOption
            key={option.value}
            title={option.title}
            subtitle={option.subtitle}
            selected={value === option.value}
            onPress={() => setValue(option.value)}
          />
        ))}
      </View>
      <View style={styles.note}>
        <InfoNote
          title={SETTINGS_COPY.flaggedIncidents}
          description={SETTINGS_COPY.flaggedIncidentsDescription}
        />
      </View>
    </PageLayout>
  );
}
const styles = StyleSheet.create({
  content: { paddingTop: Spacing.three, flexGrow: 1 },
  description: {
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
    maxWidth: 310,
  },
  panel: { borderWidth: 1, borderRadius: 8, paddingHorizontal: Spacing.three },
  note: { marginTop: "auto", paddingTop: Spacing.six },
});
