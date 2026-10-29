import { Image, StyleSheet, View } from "react-native";
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
  // Keep both states mounted so hardware pulses never wait for an image swap.
  // The existing hardware hook still owns press timing and recognition.
  return (
    <View collapsable={false} style={styles.buttonVisual}>
      <Image source={artwork[color].normal} style={[styles.normalArtwork, { opacity: isPressed ? 0 : 1 }]}
        resizeMode="contain" fadeDuration={0} />
      <Image source={artwork[color].pressed} style={[styles.artwork, { opacity: isPressed ? 1 : 0 }]}
        resizeMode="contain" fadeDuration={0} />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonVisual: { width: 132, height: 116, flexShrink: 0 },
  normalArtwork: { width: 132, height: 116 },
  artwork: { position: "absolute", left: 0, bottom: 0, width: 132, height: 116 },
});
