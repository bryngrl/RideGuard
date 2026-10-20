import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import MainLogo from "@/assets/icons/logos/main.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { StyleSheet, Text, View } from "react-native";
export function ThemePreviewCard({
  mode,
  selected,
  disabled,
  onPress,
}: {
  mode: "light" | "dark";
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();
  const dark = mode === "dark";
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      feedbackColor={dark ? colors.secondary : colors.primary}
      style={[
        styles.card,
        {
          backgroundColor: dark
            ? colors.previewDarkBackground
            : colors.previewLightBackground,
          borderColor: selected ? colors.primary : colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <MainLogo width={24} height={24} />
      <View style={styles.bars}>
        <View
          style={[
            styles.bar,
            { backgroundColor: dark ? colors.secondary : colors.primary },
          ]}
        />
        <View
          style={[
            styles.bar,
            {
              backgroundColor: dark ? colors.previewMuted : colors.previewMuted,
            },
          ]}
        />
        <View style={[styles.bar, { backgroundColor: colors.previewGreen }]} />
        <View style={[styles.bar, { backgroundColor: colors.previewBlue }]} />
      </View>
      <Text
        style={[
          Typography.body,
          { color: dark ? colors.secondary : colors.text },
        ]}
      >
        {mode === "light" ? "Light" : "Dark"}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 130,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  bars: { width: 52, gap: 2 },
  bar: { height: 7, width: "100%" },
});
