import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import React from "react";
import { ActivityIndicator, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

import { useTheme } from "@/shared/hooks";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  centerTextWithLeftIcon?: boolean;

  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  feedbackEnabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  centerTextWithLeftIcon = false,
  style,
  textStyle,
  feedbackEnabled = true,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || isLoading;

  const getVariantStyles = (): {
    container: ViewStyle;
    text: TextStyle;
    spinnerColor: string;
  } => {
    switch (variant) {
      case "secondary":
        return {
          container: {
            backgroundColor: theme.backgroundElement,

            borderColor: theme.border,
          },
          text: {
            color: theme.text,
          },
          spinnerColor: theme.text,
        };
      case "outline":
        return {
          container: {
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.primary,
          },
          text: {
            color: theme.primary,
          },
          spinnerColor: theme.primary,
        };
      case "ghost":
        return {
          container: {
            backgroundColor: "transparent",
          },
          text: {
            color: theme.primary,
          },
          spinnerColor: theme.primary,
        };
      case "danger":
        return {
          container: {
            backgroundColor: "transparent",
            borderWidth: 1.5,
            borderColor: theme.error,
          },
          text: {
            color: theme.error,
          },
          spinnerColor: theme.error,
        };
      case "primary":
      default:
        return {
          container: {
            backgroundColor: theme.primaryButton,
          },
          text: {
            color: theme.onPrimaryButton,
          },
          spinnerColor: theme.onPrimaryButton,
        };
    }
  };

  const getSizeStyles = (): {
    container: ViewStyle;
    text: TextStyle;
    iconSize: number;
  } => {
    switch (size) {
      case "sm":
        return {
          container: {
            paddingVertical: Spacing.one,
            paddingHorizontal: 10,
            minHeight: 28,
            borderRadius: BorderRadius.lg,
          },
          text: {
            ...Typography.button,
            fontWeight: "700",
          },
          iconSize: 16,
        };
      case "lg":
        return {
          container: {
            paddingVertical: Spacing.four,
            paddingHorizontal: Spacing.five,
            borderRadius: BorderRadius.lg,
            minHeight: 56,
          },
          text: {
            ...Typography.button,
            fontWeight: "700",
          },
          iconSize: 22,
        };
      case "md":
      default:
        return {
          container: {
            paddingVertical: 10,
            paddingHorizontal: Spacing.four,
            borderRadius: BorderRadius.full,
            minHeight: 40,
          },
          text: {
            ...Typography.button,
          },
          iconSize: 18,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Pressable
      feedbackEnabled={feedbackEnabled}
      feedbackColor={variant === "primary" ? theme.onPrimaryButton : undefined}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.baseContainer,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        isDisabled && [styles.disabledContainer, { backgroundColor: variant === "ghost" ? "transparent" : theme.disabledBackground }],
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
    >
        <View
          collapsable={false}
          accessibilityElementsHidden={isLoading}
          importantForAccessibility={isLoading ? "no-hide-descendants" : "auto"}
          style={[
            styles.contentRow,
            centerTextWithLeftIcon && styles.fullWidthContentRow,
            { opacity: isLoading ? 0 : 1 },
          ]}
        >
          {leftIcon && (
            <View
              style={
                centerTextWithLeftIcon
                  ? styles.absoluteLeftIcon
                  : styles.leftIcon
              }
            >
              {leftIcon}
            </View>
          )}

          <Text
            style={[
              styles.baseText,
              sizeStyles.text,
              variantStyles.text,
              isDisabled && [styles.disabledText, { color: theme.disabledText }],
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>

          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      <View collapsable={false} pointerEvents="none" accessibilityElementsHidden={!isLoading}
        importantForAccessibility={isLoading ? "auto" : "no-hide-descendants"}
        style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", opacity: isLoading ? 1 : 0 }]}>
        <ActivityIndicator animating={isLoading} color={variantStyles.spinnerColor} size="small" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leftIcon: {
    marginRight: Spacing.two,
  },
  rightIcon: {
    marginLeft: Spacing.two,
  },
  baseText: {
    textAlign: "center",
  },
  disabledContainer: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.8,
  },
  fullWidthContentRow: {
    width: "100%",
    position: "relative",
  },

  absoluteLeftIcon: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
});
