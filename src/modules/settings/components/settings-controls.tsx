import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";

export function ToggleRow({ title, description, value, onValueChange, disabled = false }: { title: string; description?: string; value: boolean; onValueChange: (value: boolean) => void; disabled?: boolean }) {
  const colors = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border, opacity: disabled ? 0.5 : 1 }]}>
      <View style={styles.copy}><Text style={[Typography.body, { color: colors.text }]}>{title}</Text>{description && <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>{description}</Text>}</View>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} trackColor={{ false: colors.border, true: colors.success }} thumbColor={colors.secondary} />
    </View>
  );
}

export function RadioOption({ title, subtitle, selected, onPress }: { title: string; subtitle?: string; selected: boolean; onPress: () => void }) {
  const colors = useTheme();
  return <Pressable onPress={onPress} style={styles.radioRow}><View style={[styles.radio, { borderColor: colors.primary }]}>{selected && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}</View><View style={styles.copy}><Text style={[Typography.body, { color: colors.text }]}>{title}</Text>{subtitle && <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>{subtitle}</Text>}</View></Pressable>;
}

export function Header({ title, right, onBack }: { title: string; right?: React.ReactNode; onBack?: () => void }) {
  const colors = useTheme();
  return <View style={[styles.header, { borderBottomColor: colors.border }]}><Pressable onPress={onBack} hitSlop={10}><Ionicons name="chevron-back" size={22} color={colors.text} /></Pressable><Text style={[Typography.bodyLarge, styles.headerTitle, { color: colors.text }]}>{title}</Text><View style={styles.right}>{right}</View></View>;
}

const styles = StyleSheet.create({
  header: { height: 56, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.four },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "Geist-SemiBold" },
  right: { width: 44, alignItems: "flex-end" },
  row: { minHeight: 60, flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  copy: { flex: 1, gap: 2 },
  radioRow: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: Spacing.three },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

