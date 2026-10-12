import { useCallback } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue, withTiming } from "react-native-reanimated";
export function useProfileFlip() {
  const progress = useSharedValue(0);
  const toggle = useCallback(() => {
    progress.value = withTiming(progress.value === 0 ? 1 : 0, {
      duration: 500,
    });
  }, [progress]);
  return { progress, toggle } as {
    progress: SharedValue<number>;
    toggle: () => void;
  };
}
