import { useTheme } from "@/shared/hooks/use-theme";
import { Typography } from "@/shared/theme";
import { StyleSheet, Text, View } from "react-native";
import { ToggleSwitch } from "./toggle-switch";
export function ToggleRow({
  title,
  description,
  value,
  onChange,
  disabled = false,
}: {
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const colors = useTheme();
  return (
    <View style={[styles.row, { opacity: disabled ? 0.55 : 1 }]}>
      <View style={styles.copy}>
        <Text style={[Typography.bodyLarge, { color: colors.text }]}>
          {title}
        </Text>
        {description && (
          <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>
            {description}
          </Text>
        )}
      </View>
      <ToggleSwitch value={value} onChange={onChange} disabled={disabled} accessibilityLabel={title} />
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  copy: { flex: 1 },
});
