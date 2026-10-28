import { useEffect, type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

/** Same soft pulse as Alerts; stops when hidden or reduced motion is enabled. */
export function SkeletonPulse({ active = true, label, style, children }: {
  active?: boolean; label: string; style?: StyleProp<ViewStyle>; children: ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    cancelAnimation(opacity);
    opacity.value = !active ? 0 : reducedMotion ? 1 : withRepeat(
      withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => cancelAnimation(opacity);
  }, [active, reducedMotion, opacity]);
  const motion = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View collapsable={false} style={[style, motion]} pointerEvents="none"
    accessible={active} accessibilityRole="progressbar" accessibilityLabel={label}
    accessibilityElementsHidden={!active} importantForAccessibility={active ? "yes" : "no-hide-descendants"}>
    {children}
  </Animated.View>;
}
