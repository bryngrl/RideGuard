import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Pressable, StyleSheet, Text } from "react-native";
import { settingsIconMap } from "../config/icon-map";
import type { SettingsRowDefinition } from "../types/settings.types";
export function SearchResultItem({
  row,
  onPress,
}: {
  row: SettingsRowDefinition;
  onPress: () => void;
}) {
  const colors = useTheme();
  const Icon = settingsIconMap[row.iconKey];
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.backgroundSelected }]}
    >
      <Icon width={18} height={18} />
      <Text style={[Typography.bodySmall, { color: colors.text }]}>
        {row.title}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    marginBottom: Spacing.two,
  },
});
