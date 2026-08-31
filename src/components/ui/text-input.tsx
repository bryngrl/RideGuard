// TODO: SVG ICON FOR EYE
import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useState } from "react";
import {
  Pressable,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export interface CustomTextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export const CustomTextInput = forwardRef<RNTextInput, CustomTextInputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      isPassword = false,
      containerStyle,
      inputStyle,
      labelStyle,
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

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text
            style={[
              styles.label,
              { color: hasError ? theme.error : theme.textSecondary },
              labelStyle, 
            ]}
          >
            {label}
          </Text>
        )}

        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: theme.inputBackground,
              borderColor: hasError
                ? theme.error
                : isFocused
                  ? theme.borderFocus
                  : theme.border,
            },
          ]}
        >
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
              style={styles.eyeButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                isPasswordVisible ? "Hide password" : "Show password"
              }
            >
              <Ionicons
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#767676"
              />
            </Pressable>
          ) : (
            rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>
          )}
        </View>

        {hasError ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={15}
              color={theme.error}
              style={styles.errorIcon}
            />
            <Text style={[styles.errorText, { color: theme.error }]}>
              {error}
            </Text>
          </View>
        ) : hint ? (
          <Text style={[styles.hintText, { color: theme.textSecondary }]}>
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
    ...Typography.label,
    marginBottom: Spacing.two,
    marginLeft: Spacing.half,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 0,
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
    fontSize: 12,
    flex: 1,
  },
  hintText: {
    ...Typography.bodySmall,
    fontSize: 12,
    marginTop: Spacing.half,
    marginLeft: Spacing.half,
  },
});
