import RedBase from "@/assets/icons/sensors/button/onboarding/red-button/red-base.svg";
import RedBodyDefault from "@/assets/icons/sensors/button/onboarding/red-button/red-body-default.svg";
import RedBodyPressed from "@/assets/icons/sensors/button/onboarding/red-button/red-body-pressed.svg";
import WhiteBase from "@/assets/icons/sensors/button/onboarding/white-button/white-base.svg";
import WhiteBodyDefault from "@/assets/icons/sensors/button/onboarding/white-button/white-body-default.svg";
import WhiteBodyPressed from "@/assets/icons/sensors/button/onboarding/white-button/white-body-pressed.svg";
import type { ButtonColor } from "../types/button-test";
import { Pressable, StyleSheet, View } from "react-native";

type ButtonTestVisualProps = {
  color: ButtonColor;
  isPressed: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
  disabled: boolean;
};

export function ButtonTestVisual({
  color,
  isPressed,
  onPressStart,
  onPressEnd,
  disabled,
}: ButtonTestVisualProps) {
  const isWhite = color === "white";

  return (
    <View style={styles.buttonVisual}>
      <View style={styles.buttonBase}>
        {isWhite ? (
          <WhiteBase width={120} height={90} />
        ) : (
          <RedBase width={120} height={90} />
        )}
      </View>

      <View style={styles.buttonBody}>
        {isWhite ? (
          isPressed ? (
            <View style={styles.pressedBody}>
              <WhiteBodyPressed width={110} height={90} />
            </View>
          ) : (
            <WhiteBodyDefault width={120} height={90} />
          )
        ) : isPressed ? (
          <View style={styles.pressedBody}>
            <RedBodyPressed width={110} height={90} />
          </View>
        ) : (
          <RedBodyDefault width={120} height={90} />
        )}
      </View>

      <Pressable
        style={styles.bodyTarget}
        // BACKEND INTEGRATION:
        // This Pressable is temporary mock input; real hardware events should
        // drive the controller instead, allowing this touch target to be removed.
        onPressIn={onPressStart}
        onPressOut={onPressEnd}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonVisual: {
    position: "relative",
    width: 120,
    height: 90,
  },
  buttonBase: {
    position: "absolute",
    top: 25,
    left: -2,
    width: 120,
    height: 90,
  },
  buttonBody: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 120,
    height: 90,
  },
  pressedBody: {
    position: "absolute",
    top: 7,
    left: 5,
    width: 120,
    height: 90,
  },
  bodyTarget: {
    position: "absolute",
    top: 0,
    left: 9,
    right: 9,
    height: 70,
  },
});
