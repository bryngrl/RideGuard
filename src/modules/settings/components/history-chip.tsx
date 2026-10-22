import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { StyleSheet, Text } from "react-native";
export function HistoryChip({
  value,
  onPress,
}: {
  value: string;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor: colors.backgroundSelected }]}
    >
      <Text style={[Typography.bodySmall, { color: colors.textMuted }]}>
        {value}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    marginRight: Spacing.two,
    marginBottom: Spacing.two,
  },
});
