import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { SettingsPageLayout } from "@/modules/settings/components/settings-page-layout";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAlertsStore } from "@/modules/alerts/store/alerts.store";
import { InfoNote } from "../../components/info-note";
import { RadioOption } from "../../components/radio-option";
import { AUTO_ARCHIVE_OPTIONS, SETTINGS_COPY } from "../../constants";
import { useSettingsStore } from "../../store/settings.store";

export function AutoArchiveScreen() {
  const colors = useTheme();
  const value = useSettingsStore((state) => state.autoArchiveHours);
  const status = useSettingsStore((state) => state.autoArchiveStatus);
  const loadAutoArchive = useSettingsStore((state) => state.loadAutoArchive);
  const saveAutoArchive = useSettingsStore((state) => state.saveAutoArchive);
  const bumpListRefresh = useAlertsStore((state) => state.bumpListRefresh);

  // Server is the source of truth; hydrate when the screen opens.
  useEffect(() => {
    void loadAutoArchive();
  }, [loadAutoArchive]);

  const isSaving = status === "saving";
  const isLoading = status === "loading";

  return (
    <SettingsPageLayout title="Auto archive" contentStyle={styles.content}>
      <Text style={[Typography.h3, { color: colors.text }]}>
        Archive old alerts
      </Text>
      <Text
        style={[
          Typography.bodySmall,
          styles.description,
          { color: colors.textMuted },
        ]}
      >
        {SETTINGS_COPY.autoArchiveDescription}
      </Text>
      <View
        style={[
          styles.panel,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        {AUTO_ARCHIVE_OPTIONS.map((option) => (
          <RadioOption
            key={String(option.value)}
            title={option.title}
            subtitle={option.subtitle}
            selected={value === option.value}
            onPress={() => {
              if (isSaving || isLoading || (status !== "error" && value === option.value)) return;
              // Retroactive rule: a saved period changes deadlines for existing
              // alerts, so refresh the lists once the server confirms the save.
              void saveAutoArchive(option.value).then((saved) => {
                if (saved) bumpListRefresh();
              });
            }}
          />
        ))}
      </View>

      {isSaving || isLoading ? (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={colors.textMuted} />
          <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>
            {isLoading ? "Loading your setting…" : "Saving…"}
          </Text>
        </View>
      ) : null}

      {status === "error" ? (
        <Text style={[Typography.bodySmall, styles.statusRow, { color: colors.error }]}>
          Couldn&apos;t reach the server. Your setting wasn&apos;t changed — tap
          an option to try again.
        </Text>
      ) : null}

      <View style={styles.note}>
        <InfoNote
          title={SETTINGS_COPY.flaggedIncidents}
          description={SETTINGS_COPY.flaggedIncidentsDescription}
        />
      </View>
    </SettingsPageLayout>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  description: {
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
    maxWidth: 310,
  },
  panel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: Spacing.three },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  note: { marginTop: "auto", paddingTop: Spacing.six },
});
