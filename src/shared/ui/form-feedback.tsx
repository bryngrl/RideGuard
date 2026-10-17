import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";

import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";

export function FormFeedback({ message, tone = "error" }: { message: string; tone?: "error" | "info" }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const color = tone === "error" ? theme.error : theme.text;
  return (
    <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(180)}
      style={[styles.container, { backgroundColor: tone === "error" ? theme.inputErrorBackground : theme.infoBackground }]}>
      <Ionicons name={tone === "error" ? "alert-circle-outline" : "information-circle-outline"} color={color} size={18} />
      <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.text, { color }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.two, borderRadius: BorderRadius.md, padding: Spacing.three },
  text: { ...Typography.bodySmall, flex: 1 },
});
