import type { ReactNode } from "react";
import { Pressable, StyleSheet, type PressableProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/shared/hooks";
import { BorderRadius } from "@/shared/theme";

export const PRESSED_STATE_OPACITY = 0.09;

type FeedbackPressableProps = PressableProps & {
  feedbackRadius?: number;
  feedbackColor?: string;
  feedbackOpacity?: number;
  feedbackInsets?: number | { top?: number; right?: number; bottom?: number; left?: number };
  feedbackEnabled?: boolean;
  feedbackBehindContent?: boolean;
};

/** A theme-aware surface tint that follows the finger without changing layout. */
export function FeedbackPressable({
  children,
  disabled,
  feedbackRadius,
  feedbackColor,
  feedbackOpacity = PRESSED_STATE_OPACITY,
  feedbackInsets,
  feedbackEnabled = true,
  feedbackBehindContent = false,
  onPressIn,
  onPressOut,
  style,
  ...props
}: FeedbackPressableProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const tint = feedbackColor ?? theme.primary;
  const feedbackStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Pressable
      {...props}
      collapsable={false}
      style={style}
      disabled={disabled}
      onPressIn={(event) => {
        if (feedbackEnabled) {
          opacity.value = reducedMotion
            ? feedbackOpacity
            : withTiming(feedbackOpacity, { duration: 120 });
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        opacity.value = reducedMotion ? 0 : withTiming(0, { duration: 150 });
        onPressOut?.(event);
      }}
    >
      {(state) => {
        const surface = StyleSheet.flatten(
          typeof style === "function" ? style(state) : style,
        );
        const border =
          typeof surface?.borderWidth === "number" ? surface.borderWidth : 0;
        const squareSize =
          typeof surface?.width === "number" &&
          surface.width === surface.height &&
          surface.width <= 48
            ? surface.width
            : typeof surface?.minWidth === "number" &&
                surface.minWidth === surface.minHeight &&
                surface.minWidth <= 48
              ? surface.minWidth
              : undefined;
        const radius =
          feedbackRadius ??
          (typeof surface?.borderRadius === "number"
            ? surface.borderRadius
            : squareSize
              ? squareSize / 2
              : BorderRadius.md);
        const surfaceTint =
          feedbackColor ??
          (typeof surface?.backgroundColor === "string" &&
          surface.backgroundColor.toLowerCase() === tint.toLowerCase()
            ? theme.secondary
            : tint);
        const inset =
          typeof feedbackInsets === "number"
            ? {
                top: feedbackInsets,
                right: feedbackInsets,
                bottom: feedbackInsets,
                left: feedbackInsets,
              }
            : feedbackInsets;
        const top = inset?.top ?? border;
        const right = inset?.right ?? border;
        const bottom = inset?.bottom ?? border;
        const left = inset?.left ?? border;
        const overlay = feedbackEnabled ? (
          <Animated.View
            collapsable={false}
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                top,
                right,
                bottom,
                left,
                backgroundColor: surfaceTint,
                borderRadius: Math.max(0, radius - border),
              },
              feedbackStyle,
            ]}
          />
        ) : null;
        return (
          <>
            {feedbackBehindContent && overlay}
            {typeof children === "function" ? children(state) : (children as ReactNode)}
            {!feedbackBehindContent && overlay}
          </>
        );
      }}
    </Pressable>
  );
}
