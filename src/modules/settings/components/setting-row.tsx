import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { settingsIconMap } from "../config/icon-map";
import type { SettingsRowDefinition } from "../types/settings.types";

export function SettingRow({
  row,
  onPress,
  danger = false,
}: {
  row: SettingsRowDefinition;
  onPress: () => void;
  danger?: boolean;
}) {
  const colors = useTheme();
  const Icon = settingsIconMap[danger ? "logout" : row.iconKey];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <Icon width={20} height={20} />
      <Text
        style={[
          Typography.body,
          styles.label,
          { color: danger ? colors.error : colors.text },
        ]}
      >
        {row.title}
      </Text>
      <Text
        style={[Typography.h2, { color: colors.textMuted, fontWeight: "300" }]}
      >
        ›
      </Text>
    </Pressable>
  );
}
export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colors = useTheme();
  return (
    <View style={styles.section}>
      <Text
        style={[Typography.body, styles.sectionTitle, { color: colors.text }]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  section: { marginBottom: Spacing.four },
  sectionTitle: { marginBottom: 14, fontFamily: "Geist-Medium" },
  card: { borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  row: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { flex: 1 },
  pressed: { opacity: 0.65 },
});
