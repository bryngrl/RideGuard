import MainLogo from "@/assets/icons/logos/main.svg";
import WhiteLogo from "@/assets/icons/logos/main-white.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Colors, Spacing, Typography } from "@/shared/theme";
import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

export function ThemePreviewCard({
  mode,
  selected,
  automatic,
  onPress,
}: {
  mode: "light" | "dark";
  selected: boolean;
  automatic: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();
  const dark = mode === "dark";
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
      style={styles.choice}
      accessibilityRole="radio"
      accessibilityLabel={`${dark ? "Dark" : "Light"} appearance`}
      accessibilityHint={automatic && selected ? "Selected by device settings. Tap to use a manual choice." : undefined}
      accessibilityState={{ checked: selected }}
    >
      <View
        style={[
          styles.preview,
          {
            backgroundColor: dark ? Colors.dark.previewDarkBackground : Colors.light.previewLightBackground,
            borderColor: selected && !automatic ? colors.primary : (dark ? Colors.dark.border : Colors.light.border),
          },
        ]}
      >
        {dark ? <WhiteLogo width={18} height={25} /> : <MainLogo width={18} height={25} />}
        <View style={styles.bars}>
          <View style={[styles.bar, { backgroundColor: dark ? Colors.dark.secondary : Colors.light.previewMuted }]} />
          <View style={[styles.bar, { backgroundColor: dark ? Colors.dark.secondary : Colors.light.previewMuted }]} />
          <View style={[styles.bar, { backgroundColor: Colors.light.previewGreen }]} />
          <View style={[styles.bar, { backgroundColor: Colors.light.previewBlue }]} />
        </View>
      </View>
      <Text style={[Typography.body, styles.label, { color: colors.text }]}>
        {dark ? "Dark" : "Light"}
      </Text>
      <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.radioMuted }]}>
        <Animated.View pointerEvents="none" style={[styles.pressedCircle, { backgroundColor: colors.primary }, pressedStyle]} />
        <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, dotStyle]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choice: { width: 112, alignItems: "center", minHeight: 186 },
  preview: {
    width: 76, height: 116, borderWidth: 1, borderRadius: 3,
    alignItems: "center", justifyContent: "space-between",
    paddingTop: Spacing.four, paddingBottom: Spacing.two,
  },
  bars: { width: 52, gap: 3 },
  bar: { height: 7, width: "100%" },
  label: { marginTop: Spacing.three, marginBottom: Spacing.three },
  radio: {
    width: 22, height: 22, borderWidth: 2, borderRadius: 11,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  pressedCircle: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, borderRadius: 11 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
