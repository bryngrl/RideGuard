import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing } from "@/shared/theme";
import { skeletonRowCount } from "@/shared/lib/skeleton-count";

/** Matches the list's date heading, icons and text lines while data loads. */
export function AlertsSkeleton({ viewportHeight, count }: { viewportHeight: number; count?: number }) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const visibleLimit = viewportHeight > 0 ? Math.max(1, Math.floor((viewportHeight - 90) / 68)) : 8;
  const rowCount = skeletonRowCount(count, visibleLimit);

  useEffect(() => {
    opacity.value = reducedMotion
      ? 1
      : withRepeat(
          withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        );
    return () => cancelAnimation(opacity);
  }, [opacity, reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const fill = { backgroundColor: theme.border };

  return (
    <Animated.View
      style={[styles.container, pulseStyle]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading alerts"
    >
      {rowCount > 0 && <View style={[styles.heading, fill]} />}
      {Array.from({ length: rowCount }, (_, index) => (
        <View key={index} style={styles.row} accessibilityElementsHidden>
          <View style={[styles.icon, fill]} />
          <View style={styles.lines}>
            <View style={[styles.time, fill]} />
            <View style={[styles.description, fill]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: Spacing.two },
  heading: {
    borderRadius: BorderRadius.full,
    height: 18,
    marginBottom: Spacing.three,
    width: 144,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.three,
    minHeight: 68,
    paddingVertical: Spacing.two,
  },
  icon: { borderRadius: BorderRadius.md, height: 34, width: 34 },
  lines: { flex: 1, gap: Spacing.two },
  time: { borderRadius: BorderRadius.full, height: 14, width: "58%" },
  description: { borderRadius: BorderRadius.full, height: 9, width: "92%" },
});
