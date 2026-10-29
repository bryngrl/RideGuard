import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import type { ButtonColor } from "../types/button-test";

const artwork = {
  red: {
    normal: require("@/assets/images/hardware/red-button.png"),
    pressed: require("@/assets/images/hardware/red-button-pressed.png"),
  },
  white: {
    normal: require("@/assets/images/hardware/white-button.png"),
    pressed: require("@/assets/images/hardware/white-button-pressed.png"),
  },
};

export function ButtonTestVisual({ color, isPressed }: { color: ButtonColor; isPressed: boolean }) {
  // Keep both states mounted so hardware pulses never wait for an image swap.
  // The existing hardware hook still owns press timing and recognition.
  return (
    <View style={styles.buttonVisual}>
      <Image source={artwork[color].normal} style={[styles.artwork, { opacity: isPressed ? 0 : 1 }]}
        contentFit="contain" contentPosition="bottom" />
      <Image source={artwork[color].pressed} style={[styles.artwork, { opacity: isPressed ? 1 : 0 }]}
        contentFit="contain" contentPosition="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonVisual: { width: 120, height: 110 },
  artwork: { position: "absolute", bottom: 0, width: 120, height: 110 },
});
