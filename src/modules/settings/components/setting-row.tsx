import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { StyleSheet, Text, View } from "react-native";
import { settingsIconMap } from "../config/icon-map";
import type { SettingsRowDefinition } from "../types/settings.types";
import { SettingsChevron } from "./settings-chevron";

export function SettingRow({
  row,
  onPress,
  danger = false,
  showDivider = true,
}: {
  row: SettingsRowDefinition;
  onPress: () => void;
  danger?: boolean;
  showDivider?: boolean;
}) {
  const colors = useTheme();
  const Icon = settingsIconMap[danger ? "logout" : row.iconKey];
  return (
    <Pressable
      onPress={onPress}
      feedbackRadius={0}
      feedbackInsets={{ bottom: showDivider ? StyleSheet.hairlineWidth : 0 }}
      accessibilityRole="button"
      accessibilityLabel={row.title}
      style={[
        styles.row,
        { borderBottomColor: colors.border, borderBottomWidth: showDivider ? StyleSheet.hairlineWidth : 0 },
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
      <SettingsChevron color={colors.textMuted} />
    </Pressable>
  );
}
export function SettingsSection({
  title,
  children,
  last = false,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  const colors = useTheme();
  return (
    <View style={[styles.section, last && styles.lastSection]}>
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
  section: { marginBottom: Spacing.five },
  lastSection: { marginBottom: 0 },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.three,
    fontFamily: "Geist-Medium",
  },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, overflow: "hidden" },
  row: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    gap: Spacing.three + Spacing.one,
  },
  label: { flex: 1 },
});
