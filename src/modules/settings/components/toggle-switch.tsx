import { useTheme } from "@/shared/hooks/use-theme";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

export function ToggleSwitch({
  value,
  onChange,
  disabled = false,
  size = "compact",
  accessibilityLabel,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  size?: "compact" | "regular";
  accessibilityLabel?: string;
}) {
  const colors = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, { duration: 250 });
  }, [progress, value]);

  const thumbStyle = useAnimatedStyle(() => ({
    // move to left more
    transform: [{ translateX: progress.value * 20 }],
  }));

  return (
    <View style={size === "compact" ? styles.compactContainer : styles.regularContainer}>
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ checked: value, disabled }}
        disabled={disabled}
        onPress={() => onChange(!value)}
      >
        <View
          style={[
            styles.track,
            {
              backgroundColor: value ? colors.success : colors.switchOff,
              opacity: disabled ? 0.55 : 1,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.thumb,
              {
                backgroundColor: colors.switchThumb,
                shadowColor: colors.switchShadow,
              },
              thumbStyle,
            ]}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    transform: [{ scale: 0.7 }],
  },
  regularContainer: {
    justifyContent: "center",
  },
  track: {
    width: 60, // Original size kept intact
    height: 31,
    borderRadius: 20,
    padding: 2,
    justifyContent: "center",
  },
  thumb: {
    width: 35, // Original size kept intact
    height: 27,
    borderRadius: 14,
    shadowOpacity: 0.18,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
