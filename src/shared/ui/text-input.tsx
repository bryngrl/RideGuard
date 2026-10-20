import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useEffect, useState, type PropsWithChildren } from "react";
import { TextInput as RNTextInput, TextInputProps as RNTextInputProps, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { useTheme } from "@/shared/hooks";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";

function FieldPressTarget({
  onPress,
  label,
  children,
}: PropsWithChildren<{ onPress?: () => void; label?: string }>) {
  return onPress ? (
    <Pressable
      onPress={onPress}
      feedbackRadius={BorderRadius.full}
      feedbackInsets={1}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {children}
    </Pressable>
  ) : (
    <>{children}</>
  );
}

export interface CustomTextInputProps extends RNTextInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;

  prefix?: string;

  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  inputWrapperStyle?: StyleProp<ViewStyle>;
  prefixStyle?: StyleProp<TextStyle>;
  onFieldPress?: () => void;
}

export const CustomTextInput = forwardRef<RNTextInput, CustomTextInputProps>(
  (
    {
      label,
      error,
      required = false,
      hint,

      prefix,

      leftIcon,
      rightIcon,
      isPassword = false,
      containerStyle,
      inputStyle,
      labelStyle,
      inputWrapperStyle,
      prefixStyle,
      onFieldPress,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const theme = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const hasError = !!error;
    const reduceMotion = useReducedMotion();
    const borderColor = useSharedValue<string>(theme.border);
    useEffect(() => {
      const color = hasError ? theme.error : isFocused ? theme.borderFocus : theme.border;
      borderColor.value = reduceMotion ? color : withTiming(color, { duration: 140 });
    }, [borderColor, hasError, isFocused, reduceMotion, theme.border, theme.borderFocus, theme.error]);
    const focusStyle = useAnimatedStyle(() => ({ borderColor: borderColor.value }));

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text
            style={[
              styles.label,
              {
                color: hasError ? theme.error : theme.text,
              },
              labelStyle,
            ]}
          >
            {label}

            {required && (
              <Text
                style={[
                  styles.requiredIndicator,
                  {
                    color: theme.error,
                  },
                ]}
              >
                {" *"}
              </Text>
            )}
          </Text>
        )}

        <FieldPressTarget onPress={onFieldPress} label={label}>
        <Animated.View
          pointerEvents={onFieldPress ? "none" : "auto"}
          style={[
            styles.inputWrapper,
            {
              backgroundColor: "#F6F6F6",
            },
            focusStyle,
            inputWrapperStyle,
            rest.editable === false && styles.disabled,
            hasError && {
              backgroundColor: theme.inputErrorBackground,
              borderColor: theme.error,
            },
          ]}
        >
          {prefix && (
            <View
              style={[
                styles.prefixContainer,
                {
                  borderRightColor: hasError
                    ? theme.error
                    : isFocused
                      ? theme.borderFocus
                      : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.prefixText,
                  {
                    color: theme.textMuted,
                  },
                  prefixStyle,
                ]}
              >
                {prefix}
              </Text>
            </View>
          )}

          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          <RNTextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: theme.text,
              },
              inputStyle,
            ]}
            placeholderTextColor={theme.textMuted}
            secureTextEntry={isPassword && !isPasswordVisible}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            {...rest}
          />

          {isPassword ? (
            <Pressable
              onPress={() => setIsPasswordVisible((prev) => !prev)}
              disabled={rest.editable === false}
              style={styles.eyeButton}
              feedbackRadius={14}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                isPasswordVisible ? "Hide password" : "Show password"
              }
              accessibilityState={{ selected: isPasswordVisible, disabled: rest.editable === false }}
            >
              <Ionicons
                name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#767676"
              />
            </Pressable>
          ) : (
            rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>
          )}
        </Animated.View>
        </FieldPressTarget>

        {hasError ? (
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(180)} style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={15}
              color={theme.error}
              style={styles.errorIcon}
            />

            <Text
              accessibilityLiveRegion="polite"
              style={[
                styles.errorText,
                {
                  color: theme.error,
                },
              ]}
            >
              {error}
            </Text>
          </Animated.View>
        ) : hint ? (
          <Text
            style={[
              styles.hintText,
              {
                color: theme.textMuted,
              },
            ]}
          >
            {hint}
          </Text>
        ) : null}
      </View>
    );
  },
);

CustomTextInput.displayName = "CustomTextInput";

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: Spacing.one,
  },
  label: {
    ...Typography.bodySmall,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.two,
    marginLeft: Spacing.half,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    minHeight: 50,
  },
  input: {
    flex: 1,
    ...Typography.input,
    paddingVertical: 12,
  },
  leftIcon: {
    marginRight: Spacing.two,
  },
  rightIcon: {
    marginLeft: Spacing.two,
  },
  eyeButton: {
    padding: Spacing.one,
  },
  disabled: {
    opacity: 0.6,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.two,
    marginLeft: Spacing.half,
  },
  errorIcon: {
    marginRight: Spacing.one,
  },
  errorText: {
    ...Typography.bodySmall,
    fontSize: 13,
    flex: 1,
  },
  hintText: {
    ...Typography.bodySmall,
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.half,
    marginLeft: Spacing.half,
  },
  requiredIndicator: {
    fontWeight: "700",
  },
  prefixContainer: {
    alignSelf: "stretch",
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    marginLeft: -Spacing.three,
    marginRight: Spacing.three,
    borderRightWidth: 1,
  },

  prefixText: {
    ...Typography.bodySmall,
    fontWeight: "400",
  },
});
