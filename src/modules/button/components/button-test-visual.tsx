import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import type { ButtonColor } from "../types/button-test";

const artwork = {
  red: {
    normal: require("../../../../assets/images/hardware/red-button.png"),
    pressed: require("../../../../assets/images/hardware/red-button-pressed.png"),
  },
  white: {
    normal: require("../../../../assets/images/hardware/white-button.png"),
    pressed: require("../../../../assets/images/hardware/white-button-pressed.png"),
  },
};

export function ButtonTestVisual({ color, isPressed }: { color: ButtonColor; isPressed: boolean }) {
  const pressed = useRef(new Animated.Value(isPressed ? 1 : 0)).current;
  const reduceMotion = useReducedMotion();
  const width = color === "white" ? 132 : 124;
  const normal = Image.resolveAssetSource(artwork[color].normal);
  const down = Image.resolveAssetSource(artwork[color].pressed);
  useEffect(() => {
    const motion = Animated.timing(pressed, { toValue: isPressed ? 1 : 0,
      duration: reduceMotion ? 0 : isPressed ? 60 : 100, useNativeDriver: true });
    motion.start();
    return () => motion.stop();
  }, [isPressed, pressed, reduceMotion]);
  // Keep both states mounted so hardware pulses never wait for an image swap.
  // The existing hardware hook still owns press timing and recognition.
  return (
    <View collapsable={false} style={styles.buttonVisual}>
      <Animated.Image source={artwork[color].normal} style={[styles.artwork, {
        width, height: width * normal.height / normal.width,
        opacity: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
      }]}
        resizeMode="contain" fadeDuration={0} />
      <Animated.Image source={artwork[color].pressed} style={[styles.artwork, {
        width, height: width * down.height / down.width, opacity: pressed,
      }]}
        resizeMode="contain" fadeDuration={0} />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonVisual: { width: 132, height: 116, flexShrink: 0, alignItems: "center" },
  artwork: { position: "absolute", bottom: 0 },
});
