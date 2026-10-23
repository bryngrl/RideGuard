import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks";
import { BorderRadius, FontFamily, Typography } from "@/shared/theme";
import { useRef } from "react";
import { useReducedMotion } from "react-native-reanimated";
import {
  Animated,
  PanResponder,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

interface SlideButtonProps {
  label: string;
  onComplete: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;

  trackColor?: string;
  borderColor?: string;
  thumbColor?: string;
  labelColor?: string;
  arrowColor?: string;
}

export function SlideButton({
  label,
  onComplete,
  disabled = false,
  style,
  trackColor,
  borderColor,
  thumbColor,
  labelColor,
  arrowColor,
}: SlideButtonProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();

  const translateX = useRef(new Animated.Value(0)).current;

  const maxTranslateX = useRef(0);

  const startPosition = useRef(0);

  const disabledRef = useRef(disabled);
  const reduceMotionRef = useRef(reduceMotion);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  disabledRef.current = disabled;
  reduceMotionRef.current = reduceMotion;
  onCompleteRef.current = onComplete;

  const thumbSize = 54;
  const thumbInset = 6;

  const resolvedTrackColor = trackColor ?? `${theme.error}18`;

  const resolvedBorderColor = borderColor ?? theme.error;

  const resolvedThumbColor = thumbColor ?? theme.error;

  const resolvedLabelColor = labelColor ?? theme.error;

  const resolvedArrowColor = arrowColor ?? "#FFFFFF";

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return !disabledRef.current && !completedRef.current && maxTranslateX.current > 0;
      },

      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          !disabledRef.current && !completedRef.current &&
          maxTranslateX.current > 0 &&
          Math.abs(gestureState.dx) > 5
        );
      },

      onPanResponderGrant: () => {
        startPosition.current = maxTranslateX.current;
      },

      onPanResponderMove: (_, gestureState) => {
        const nextPosition = startPosition.current + gestureState.dx;

        const clampedPosition = Math.max(
          0,
          Math.min(maxTranslateX.current, nextPosition),
        );

        translateX.setValue(clampedPosition);
      },

      onPanResponderRelease: (_, gestureState) => {
        const max = maxTranslateX.current;

        if (max <= 0) {
          return;
        }
        const draggedDistance = Math.abs(gestureState.dx);

        const completionThreshold = max * 0.7;

        if (gestureState.dx < 0 && draggedDistance >= completionThreshold) {
          completedRef.current = true;
          if (reduceMotionRef.current) {
            translateX.setValue(0);
            onCompleteRef.current();
            return;
          }
          Animated.timing(translateX, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            onCompleteRef.current();
          });

          return;
        }
        if (reduceMotionRef.current) {
          translateX.setValue(max);
          return;
        }
        Animated.spring(translateX, {
          toValue: max,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },

      onPanResponderTerminate: () => {
        if (reduceMotionRef.current) {
          translateX.setValue(maxTranslateX.current);
          return;
        }
        Animated.spring(translateX, {
          toValue: maxTranslateX.current,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
    }),
  ).current;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: resolvedTrackColor,
          borderColor: resolvedBorderColor,
        },
        style,
      ]}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;

        const maxPosition = Math.max(0, width - thumbSize - thumbInset * 2);

        maxTranslateX.current = maxPosition;
        translateX.setValue(maxPosition);
      }}
    >
      <Text
        pointerEvents="none"
        style={[
          Typography.button,
          styles.label,
          {
            color: resolvedLabelColor,
          },
        ]}
      >
        {label}
      </Text>

      <Animated.View
        {...panResponder.panHandlers}
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Slide left to confirm"
        accessibilityActions={[{ name: "activate", label }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "activate" && !disabledRef.current && !completedRef.current) {
            completedRef.current = true;
            onCompleteRef.current();
          }
        }}
        style={[
          styles.thumb,
          {
            backgroundColor: resolvedThumbColor,
            transform: [
              {
                translateX,
              },
            ],
          },
        ]}
      >
        <Ionicons name="arrow-back" size={24} color={resolvedArrowColor} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 66,

    borderWidth: 1,
    borderRadius: BorderRadius.full,

    justifyContent: "center",

    overflow: "hidden",

    paddingHorizontal: 6,
  },

  label: {
    position: "absolute",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FontFamily.geistMedium,
    left: 0,
    right: 0,

    textAlign: "center",
  },

  thumb: {
    width: 54,
    height: 54,

    borderRadius: BorderRadius.full,

    alignItems: "center",
    justifyContent: "center",

  },
});
