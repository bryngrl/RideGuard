import { BorderRadius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useRef } from "react";
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

  const translateX = useRef(new Animated.Value(0)).current;

  const maxTranslateX = useRef(0);

  const startPosition = useRef(0);

  const disabledRef = useRef(disabled);
  const onCompleteRef = useRef(onComplete);

  disabledRef.current = disabled;
  onCompleteRef.current = onComplete;

  const thumbSize = 40;

  const resolvedTrackColor = trackColor ?? `${theme.error}18`;

  const resolvedBorderColor = borderColor ?? theme.error;

  const resolvedThumbColor = thumbColor ?? theme.error;

  const resolvedLabelColor = labelColor ?? theme.error;

  const resolvedArrowColor = arrowColor ?? "#FFFFFF";

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return !disabledRef.current && maxTranslateX.current > 0;
      },

      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          !disabledRef.current &&
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
          Animated.timing(translateX, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            onCompleteRef.current();
          });

          return;
        }
        Animated.spring(translateX, {
          toValue: max,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },

      onPanResponderTerminate: () => {
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

        const maxPosition = Math.max(0, width - thumbSize - Spacing.one * 2);

        maxTranslateX.current = maxPosition;
        translateX.setValue(maxPosition);
      }}
    >
      {/* LABEL */}
      <Text
        pointerEvents="none"
        style={[
          Typography.body,
          styles.label,
          {
            color: resolvedLabelColor,
          },
        ]}
      >
        {label}
      </Text>

      {/* SLIDE THUMB */}
      <Animated.View
        {...panResponder.panHandlers}
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
        <Text
          style={[
            styles.arrow,
            {
              color: resolvedArrowColor,
            },
          ]}
        >
          ←
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 60,

    borderWidth: 1,
    borderRadius: BorderRadius.full,

    justifyContent: "center",

    overflow: "hidden",

    paddingHorizontal: Spacing.one,
  },

  label: {
    position: "absolute",
    fontWeight: "900",
    left: 0,
    right: 0,

    textAlign: "center",
  },

  thumb: {
    width: 40,
    height: 40,

    borderRadius: BorderRadius.full,

    alignItems: "center",
    justifyContent: "center",

    elevation: 2,
  },

  arrow: {
    fontSize: 24,
    lineHeight: 26,

    fontFamily: Typography.h3.fontFamily,
  },
});
