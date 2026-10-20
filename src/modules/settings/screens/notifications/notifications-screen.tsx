import { SettingsPageLayout } from "@/modules/settings/components/settings-page-layout";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { StyleSheet, Text } from "react-native";
import { ToggleRow } from "../../components/toggle-row";
import { NOTIFICATION_COPY } from "../../constants";
import { useSettingsStore } from "../../store/settings.store";

export function NotificationsScreen() {
  const colors = useTheme();
  const alertsEnabled = useSettingsStore((state) => state.alertsEnabled);
  const pushEnabled = useSettingsStore((state) => state.pushEnabled);
  const setAlertsEnabled = useSettingsStore((state) => state.setAlertsEnabled);
  const setPushEnabled = useSettingsStore((state) => state.setPushEnabled);

  return (
    <SettingsPageLayout title="Notification">
      <Text style={[Typography.h4, { color: colors.text }]}>
        {NOTIFICATION_COPY.alertsHeading}
      </Text>
      <ToggleRow
        title={NOTIFICATION_COPY.alerts}
        value={alertsEnabled}
        onChange={setAlertsEnabled}
      />
      <ToggleRow
        title={NOTIFICATION_COPY.possibleThreat}
        description={NOTIFICATION_COPY.alwaysOn}
        value
        onChange={() => undefined}
        disabled
      />
      <Text style={[Typography.h4, styles.delivery, { color: colors.text }]}>
        {NOTIFICATION_COPY.delivery}
      </Text>
      <ToggleRow
        title={NOTIFICATION_COPY.push}
        value={pushEnabled}
        onChange={setPushEnabled}
      />
    </SettingsPageLayout>
  );
}

const styles = StyleSheet.create({
  delivery: { marginTop: Spacing.three },
});
