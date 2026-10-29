import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { recordMpinActivity } from "@/modules/mpin/services/mpin-activity";
import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { TextInput as RNTextInput, TextInputProps as RNTextInputProps, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { useTheme } from "@/shared/hooks";
import { formatInputEdit, type InputFormat } from "@/shared/lib/input-formats";
import { BorderRadius, FontFamily, Spacing, Typography } from "@/shared/theme";
import { useScrollFocusedInput } from "./keyboard-aware-form-scroll-view";

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
  /** Keep the form value raw while formatting only the visible input. */
  inputFormat?: InputFormat;
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
      inputFormat,
      onFocus,
      onBlur,
      onChangeText,
      onSelectionChange,
      value,
      ...rest
    },
    ref,
  ) => {
    const theme = useTheme();
    const scrollFocusedInput = useScrollFocusedInput();
    const fieldRef = useRef<View>(null);
    const focusedTarget = useRef<number | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [selection, setSelection] = useState<{ start: number; end: number } | undefined>();
    const selectionRelease = useRef<number | null>(null);
    const displayed = inputFormat ? inputFormat.format(value ?? "") : value;
    const previousDisplay = useRef(displayed ?? "");
    useEffect(() => { previousDisplay.current = displayed ?? ""; }, [displayed]);
    useEffect(() => () => {
      if (selectionRelease.current !== null) cancelAnimationFrame(selectionRelease.current);
    }, []);
    const changeFormatted = (next: string) => {
        recordMpinActivity();
      if (!inputFormat) { onChangeText?.(next); return; }
      const { raw, formatted, cursor } = formatInputEdit(previousDisplay.current, next, inputFormat);
      previousDisplay.current = formatted;
      if (selectionRelease.current !== null) cancelAnimationFrame(selectionRelease.current);
      setSelection({ start: cursor, end: cursor });
      // Control selection just long enough for the formatted value to reach native.
      // Leaving it controlled makes a later tap fight with the old cursor position.
      selectionRelease.current = requestAnimationFrame(() => {
        selectionRelease.current = requestAnimationFrame(() => {
          setSelection(undefined);
          selectionRelease.current = null;
        });
      });
      onChangeText?.(raw);
    };

    const hasError = !!error;
    useEffect(() => {
      if (isFocused && focusedTarget.current !== null) {
        scrollFocusedInput(focusedTarget.current, fieldRef);
      }
    }, [error, hint, isFocused, scrollFocusedInput]);
    const reduceMotion = useReducedMotion();
    const borderColor = useSharedValue<string>(theme.formBorder);
    useEffect(() => {
      const color = hasError ? theme.error : isFocused ? theme.borderFocus : theme.formBorder;
      borderColor.value = reduceMotion ? color : withTiming(color, { duration: 140 });
    }, [borderColor, hasError, isFocused, reduceMotion, theme.formBorder, theme.borderFocus, theme.error]);
    const focusStyle = useAnimatedStyle(() => ({ borderColor: borderColor.value }));

    return (
      <View ref={fieldRef} style={[styles.container, containerStyle]}
        onLayout={() => {
          if (isFocused && focusedTarget.current !== null) {
            scrollFocusedInput(focusedTarget.current, fieldRef);
          }
        }}>
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
              backgroundColor: isFocused ? theme.backgroundSelected : theme.inputBackground,
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
                    color: hasError
                      ? theme.error
                      : isFocused
                        ? theme.borderFocus
                        : theme.textMuted,
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
            value={displayed}
            selection={inputFormat && isFocused ? selection : undefined}
            onSelectionChange={onSelectionChange}
            onChangeText={changeFormatted}
            style={[
              styles.input,
              {
                color: theme.text,
              },
              inputStyle,
            ]}
            placeholderTextColor={theme.textMuted}
            selectionColor={theme.accent}
            secureTextEntry={isPassword && !isPasswordVisible}
            autoCapitalize={isPassword ? "none" : undefined}
            autoCorrect={isPassword ? false : undefined}
            onFocus={(e) => {
              setIsFocused(true);
              focusedTarget.current = e.nativeEvent.target;
              scrollFocusedInput(e.nativeEvent.target, fieldRef);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              focusedTarget.current = null;
              if (selectionRelease.current !== null) cancelAnimationFrame(selectionRelease.current);
              selectionRelease.current = null;
              setSelection(undefined);
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
                color={theme.iconMuted}
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
    fontFamily: FontFamily.geistMedium,
    marginBottom: Spacing.two,
    marginLeft: Spacing.half,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    minHeight: 46,
  },
  input: {
    flex: 1,
    ...Typography.input,
    paddingVertical: Spacing.two,
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
    ...Typography.input,
    fontSize: 14,
  },
});
