import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

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
  const reducedMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const selection = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    selection.value = reducedMotion ? (selected ? 1 : 0) : withTiming(selected ? 1 : 0, { duration: 220 });
  }, [reducedMotion, selected, selection]);
  const pressedStyle = useAnimatedStyle(() => ({ opacity: pressed.value }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: selection.value,
    transform: [{ scale: 0.7 + selection.value * 0.3 }],
  }));
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = reducedMotion ? 0.09 : withTiming(0.09, { duration: 100 });
      }}
      onPressOut={() => {
        pressed.value = reducedMotion ? 0 : withTiming(0, { duration: 150 });
      }}
      feedbackEnabled={false}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityState={{ checked: selected, disabled }}
      style={[styles.row, { opacity: disabled ? 0.45 : 1 }]}
    >
      <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.radioMuted }]}>
        <Animated.View pointerEvents="none" style={[styles.pressedCircle, { backgroundColor: colors.primary }, pressedStyle]} />
        <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, dotStyle]} />
      </View>
      <View style={styles.copy}>
        <Text style={[Typography.body, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[Typography.bodySmall, styles.subtitle, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: Spacing.three },
  radio: {
    width: 22, height: 22, borderWidth: 2, borderRadius: 11,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  pressedCircle: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, borderRadius: 11 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  copy: { flex: 1 },
  subtitle: { fontStyle: "italic", marginTop: Spacing.one },
});
