import React from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";

import {
    BorderRadius,
    BrandColors,
    Spacing,
    Typography
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
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
  style,
  textStyle,
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
            borderWidth: 1,
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
            backgroundColor: "transparent",
            borderWidth: 1.5,
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
            backgroundColor: theme.error,
          },
          text: {
            color: "#FFFFFF",
          },
          spinnerColor: "#FFFFFF",
        };
      case "primary":
      default:
        return {
          container: {
            backgroundColor: BrandColors.primary,
          },
          text: {
            color: BrandColors.secondary,
          },
          spinnerColor: BrandColors.secondary,
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
            paddingVertical: Spacing.two,
            paddingHorizontal: Spacing.three,
            borderRadius: BorderRadius.sm,
            minHeight: 36,
          },
          text: {
            ...Typography.bodySmall,
            fontWeight: "600",
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
            fontSize: 16,
            fontWeight: "700",
          },
          iconSize: 22,
        };
      case "md":
      default:
        return {
          container: {
            paddingVertical: 14,
            paddingHorizontal: Spacing.four,
            borderRadius: BorderRadius.sm,
            minHeight: 48,
          },
          text: {
            ...Typography.button,
            fontSize: 15,
          },
          iconSize: 18,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.baseContainer,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabledContainer,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator color={variantStyles.spinnerColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text
            style={[
              styles.baseText,
              sizeStyles.text,
              variantStyles.text,
              isDisabled && styles.disabledText,
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
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
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  disabledContainer: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.8,
  },
});
