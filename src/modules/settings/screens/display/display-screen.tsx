import { SettingsPageLayout } from "@/modules/settings/components/settings-page-layout";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { useColorScheme as useDeviceColorScheme, StyleSheet, Text, View } from "react-native";
import { ThemePreviewCard } from "../../components/theme-preview-card";
import { ToggleRow } from "../../components/toggle-row";
import { SETTINGS_COPY } from "../../constants";
import { useSettingsStore } from "../../store/settings.store";

export function DisplayScreen() {
  const colors = useTheme();
  const preference = useSettingsStore((state) => state.themePreference);
  const setPreference = useSettingsStore((state) => state.setThemePreference);
  const deviceScheme = useDeviceColorScheme() === "dark" ? "dark" : "light";
  const system = preference === "system";
  const effective = system ? deviceScheme : preference;

  return (
    <SettingsPageLayout title="Display">
      <Text style={[Typography.h4, { color: colors.text }]}>Appearance</Text>
      <View style={styles.options} accessibilityRole="radiogroup">
        <ThemePreviewCard
          mode="light"
          selected={effective === "light"}
          automatic={system}
          onPress={() => setPreference("light")}
        />
        <ThemePreviewCard
          mode="dark"
          selected={effective === "dark"}
          automatic={system}
          onPress={() => setPreference("dark")}
        />
      </View>
      <View style={styles.deviceSetting}>
        <ToggleRow
          title="Use device settings"
          description={SETTINGS_COPY.appearanceDescription}
          value={system}
          onChange={(value) => setPreference(value ? "system" : effective)}
        />
      </View>
    </SettingsPageLayout>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: "row", justifyContent: "center", gap: Spacing.three, marginTop: Spacing.five },
  deviceSetting: { marginTop: Spacing.four },
});
