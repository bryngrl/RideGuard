import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { Spacing, Typography } from "@/shared/theme";

/** Visual feedback only: the hardware's SOS event still authorizes success. */
export function ButtonHoldProgress({ color, borderColor }: { color: string; borderColor: string }) {
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1, duration: reduceMotion ? 0 : 3000, easing: Easing.linear, useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reduceMotion]);
  return <View style={styles.container}>
    <View style={[styles.track, { borderColor }]} accessibilityRole="progressbar" accessibilityLabel="Holding red button">
      <Animated.View style={[styles.fill, { backgroundColor: color, transform: [{ scaleX: progress }] }]} />
    </View>
    <Text style={[Typography.caption, { color }]}>Holding…</Text>
  </View>;
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: Spacing.two, paddingVertical: Spacing.two },
  track: { width: 160, height: 8, borderWidth: 1, borderRadius: 4, overflow: "hidden" },
  fill: { width: "100%", height: "100%", transformOrigin: "left center" },
});
