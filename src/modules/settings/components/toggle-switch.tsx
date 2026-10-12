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
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
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
    <View style={styles.container}>
      <Pressable
        accessibilityRole="switch"
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
  container: {
    transform: [{ scale: 0.7 }], // 👈 Change this number here to shrink or grow it easily!
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
