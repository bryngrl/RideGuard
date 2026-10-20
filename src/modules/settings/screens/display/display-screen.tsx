import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { SettingsPageLayout } from "@/modules/settings/components/settings-page-layout";
import { StyleSheet, Text, View } from "react-native";
import { RadioOption } from "../../components/radio-option";
import { ThemePreviewCard } from "../../components/theme-preview-card";
import { ToggleRow } from "../../components/toggle-row";
import { SETTINGS_COPY } from "../../constants";
import { useSettingsStore } from "../../store/settings.store";
export function DisplayScreen() {
  const colors = useTheme();
  const preference = useSettingsStore((state) => state.themePreference);
  const setPreference = useSettingsStore((state) => state.setThemePreference);
  const system = preference === "system";
  return (
    <SettingsPageLayout title="Display" contentStyle={styles.content}>
      <Text style={[Typography.h3, { color: colors.text }]}>Appearance</Text>
      <View style={styles.cards}>
        <ThemePreviewCard
          mode="light"
          selected={preference === "light"}
          disabled={system}
          onPress={() => setPreference("light")}
        />
        <ThemePreviewCard
          mode="dark"
          selected={preference === "dark"}
          disabled={system}
          onPress={() => setPreference("dark")}
        />
      </View>
      <View style={styles.radios}>
        <RadioOption
          title="Light"
          selected={preference === "light"}
          disabled={system}
          onPress={() => setPreference("light")}
        />
        <RadioOption
          title="Dark"
          selected={preference === "dark"}
          disabled={system}
          onPress={() => setPreference("dark")}
        />
      </View>
      <ToggleRow
        title="Use device settings"
        description={SETTINGS_COPY.appearanceDescription}
        value={system}
        onChange={(value) => setPreference(value ? "system" : "light")}
      />
    </SettingsPageLayout>
  );
}
const styles = StyleSheet.create({
  content: { paddingTop: Spacing.three },
  cards: { flexDirection: "row", gap: Spacing.four, marginTop: Spacing.four },
  radios: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: Spacing.two,
  },
});
