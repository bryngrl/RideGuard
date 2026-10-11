import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface SettingRowProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
}

export function SettingRow({
  title,
  icon = "ellipse-outline",
  onPress,
  danger,
}: SettingRowProps) {
  const colors = useTheme();
  const color = danger ? colors.error : colors.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[Typography.body, styles.title, { color }]}>{title}</Text>
      <Ionicons
        name="chevron-forward"
        size={18}
        weight={2}
        color={colors.textMuted}
      />
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
        style={[
          Typography.caption,
          styles.sectionTitle,
          { color: colors.primary },
        ]}
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
  section: { marginBottom: Spacing.three },
  sectionTitle: { marginBottom: Spacing.two },
  card: { borderWidth: 0.5, borderRadius: BorderRadius.lg, overflow: "hidden" },
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D9D9D9",
  },
  title: { flex: 1 },
  pressed: { opacity: 0.65 },
});
