import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing } from "@/shared/theme";
import { PageLayout } from "@/shared/ui";
import { StyleSheet, View } from "react-native";
import { InfoNote } from "../../components/info-note";
import { ToggleRow } from "../../components/toggle-row";
import { SETTINGS_COPY } from "../../constants";
import { useSettingsStore } from "../../store/settings.store";
export function LocationScreen() {
  const colors = useTheme();
  const state = useSettingsStore();
  return (
    <PageLayout title="Location sharing" contentStyle={styles.content}>
      <ToggleRow
        title={SETTINGS_COPY.deviceLocation}
        description={SETTINGS_COPY.locationDescription}
        value={state.locationInApp}
        onChange={state.setLocationInApp}
      />
      <ToggleRow
        title={SETTINGS_COPY.contactLocation}
        description={SETTINGS_COPY.locationDescription}
        value={state.locationWithContacts}
        onChange={state.setLocationWithContacts}
      />
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
  note: { marginTop: "auto", paddingTop: Spacing.six },
});
