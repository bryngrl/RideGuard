import { SettingsPageLayout } from "@/modules/settings/components/settings-page-layout";
import { StyleSheet } from "react-native";
import { ToggleRow } from "../../components/toggle-row";
import { SETTINGS_COPY } from "../../constants";
import { useSettingsStore } from "../../store/settings.store";
export function LocationScreen() {
  const state = useSettingsStore();
  return (
    <SettingsPageLayout title="Location sharing" contentStyle={styles.content}>
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
    </SettingsPageLayout>
  );
}
const styles = StyleSheet.create({
  content: { flexGrow: 1 },
});
