import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { SettingsPageLayout } from "@/modules/settings/components/settings-page-layout";
import { StyleSheet, Text } from "react-native";
import { ToggleRow } from "../../components/toggle-row";
import { NOTIFICATION_COPY } from "../../constants";
import { useSettingsStore } from "../../store/settings.store";
export function NotificationsScreen() {
  const colors = useTheme();
  const state = useSettingsStore();
  return (
    <SettingsPageLayout title="Notification center" contentStyle={styles.content}>
      <Text style={[Typography.h3, { color: colors.text }]}>
        {NOTIFICATION_COPY.flags}
      </Text>
      <ToggleRow
        title={NOTIFICATION_COPY.alerts}
        value={state.alertsEnabled}
        onChange={state.setAlertsEnabled}
      />
      <ToggleRow
        title={NOTIFICATION_COPY.attackDetected}
        description={NOTIFICATION_COPY.alwaysOn}
        value
        onChange={() => undefined}
        disabled
      />
      <Text style={[Typography.h3, styles.delivery, { color: colors.text }]}>
        {NOTIFICATION_COPY.delivery}
      </Text>
      <ToggleRow
        title={NOTIFICATION_COPY.push}
        value={state.pushEnabled}
        onChange={state.setPushEnabled}
      />
      <ToggleRow
        title={NOTIFICATION_COPY.sound}
        value={state.soundEnabled}
        onChange={state.setSoundEnabled}
      />
      <ToggleRow
        title={NOTIFICATION_COPY.vibration}
        value={state.vibrationEnabled}
        onChange={state.setVibrationEnabled}
      />
    </SettingsPageLayout>
  );
}
const styles = StyleSheet.create({
  content: { paddingTop: Spacing.three },
  delivery: { marginTop: Spacing.three },
});
