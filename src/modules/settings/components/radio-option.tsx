import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { StyleSheet, Text, View } from "react-native";
export function RadioOption({
  title,
  subtitle,
  selected,
  onPress,
  disabled = false,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      feedbackRadius={0}
      disabled={disabled}
      style={[styles.row, { opacity: disabled ? 0.45 : 1 }]}
    >
      <View
        style={[
          styles.radio,
          { borderColor: selected ? colors.primary : colors.radioMuted },
        ]}
      >
        {selected && (
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        )}
      </View>
      <View style={styles.copy}>
        <Text style={[Typography.body, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text
            style={[
              Typography.bodySmall,
              styles.subtitle,
              { color: colors.textMuted },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  radio: {
    width: 22,
    height: 22,
    borderWidth: 3,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  copy: { flex: 1 },
  subtitle: { fontStyle: "italic", marginTop: Spacing.one },
});
