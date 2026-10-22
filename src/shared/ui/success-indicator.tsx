import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius } from "@/shared/theme";

/** Quiet success feedback reusable across forms; respects reduced motion. */
export function SuccessIndicator({ label = "Completed successfully" }: { label?: string }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    progress.value = reduceMotion ? 1 : withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);
  const motion = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }));
  return (
    <Animated.View accessible accessibilityRole="image" accessibilityLabel={label}
      style={[styles.container, { backgroundColor: theme.infoBackground }, motion]}>
      <Ionicons name="checkmark" size={40} color={theme.text} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { width: 80, height: 80, borderRadius: BorderRadius.full, alignItems: "center", justifyContent: "center" },
});
