import { useFocusEffect } from "expo-router";
import { useCallback, type ReactNode } from "react";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

/** Slide content without native-stack transitions on Android. */
export function MpinSettingsMotion({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const offset = useSharedValue(reducedMotion ? 0 : 32);
  useFocusEffect(useCallback(() => {
    offset.value = reducedMotion ? 0 : 32;
    offset.value = withTiming(0, { duration: reducedMotion ? 0 : 260, easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(offset);
  }, [offset, reducedMotion]));
  const motion = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  return <Animated.View collapsable={false} style={[{ flex: 1 }, motion]}>{children}</Animated.View>;
}
