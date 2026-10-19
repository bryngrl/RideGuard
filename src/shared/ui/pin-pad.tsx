import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, PinLayout, Spacing, Typography, getPinKeypadGap } from "@/shared/theme";

interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  errorVersion?: number;
  length?: number;
  label?: string;
  indicatorStyle?: StyleProp<ViewStyle>;
  keypadStyle?: StyleProp<ViewStyle>;
}

function PinIndicator({ filled, active, error, style }: { filled: boolean; active: boolean; error: boolean; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = filled && !reduceMotion ? withSequence(withTiming(1.08, { duration: 85 }), withTiming(1, { duration: 110 })) : 1;
  }, [filled, reduceMotion, scale]);
  const motion = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.indicator, style, motion, {
      backgroundColor: error ? theme.inputErrorBackground : theme.backgroundElement,
      borderColor: error ? theme.error : active ? theme.borderFocus : theme.border,
    }]}>
      {filled && <View style={[styles.dot, { backgroundColor: error ? theme.error : theme.text }]} />}
    </Animated.View>
  );
}

/** Accessible, masked input. PIN values are never rendered as text or announced. */
export function PinPad({ value, onChange, onComplete, disabled = false, error = false, errorVersion = 0, length = 4, label = "MPIN", indicatorStyle, keypadStyle }: PinPadProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const current = useRef(value);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const keypadGap = getPinKeypadGap(height - insets.top - insets.bottom);
  const completed = useRef(false);
  current.current = value;
  useEffect(() => { if (value.length < length) completed.current = false; }, [value, length]);
  const shake = useSharedValue(0);
  useEffect(() => {
    if (errorVersion > 0 && !reduceMotion) {
      shake.value = withSequence(withTiming(-5, { duration: 60 }), withTiming(5, { duration: 70 }), withTiming(-3, { duration: 60 }), withTiming(0, { duration: 70 }));
    }
  }, [errorVersion, reduceMotion, shake]);
  const motion = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const enter = (digit: string) => {
    if (disabled || completed.current || current.current.length >= length) return;
    const next = current.current + digit;
    current.current = next;
    onChange(next);
    if (next.length === length) { completed.current = true; onComplete(next); }
  };
  const backspace = () => {
    if (disabled) return;
    completed.current = false;
    current.current = current.current.slice(0, -1);
    onChange(current.current);
  };
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicators, length > 4 && { gap: Spacing.two }, motion]} accessible accessibilityLabel={`${label}: ${value.length} of ${length} digits entered`}
        accessibilityLiveRegion="polite" importantForAccessibility="yes">
        {Array.from({ length }, (_, index) => <PinIndicator key={index} filled={index < value.length} active={!disabled && index === value.length} error={error} style={indicatorStyle} />)}
      </Animated.View>
      <View style={[styles.keypad, { marginTop: keypadGap }, keypadStyle, disabled && styles.disabled]}>
        {[ ["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["", "0", "delete"] ].map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyRow}>
            {row.map((key, index) => key === "" ? <View key={index} style={styles.key} /> : (
              <Pressable key={key} disabled={disabled || (key === "delete" && !value.length)}
                onPress={() => key === "delete" ? backspace() : enter(key)}
                accessibilityRole="button" accessibilityLabel={key === "delete" ? "Delete last digit" : key}
                accessibilityState={{ disabled: disabled || (key === "delete" && !value.length) }}
                style={({ pressed }) => [styles.key, pressed && { backgroundColor: theme.backgroundSelected, opacity: 0.8 }]}>
                {key === "delete" ? <Ionicons name="backspace-outline" size={25} color={theme.text} /> :
                  <Text style={[styles.digit, { color: theme.text }]}>{key}</Text>}
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", alignItems: "center" },
  indicators: { width: "100%", maxWidth: 320, flexDirection: "row", justifyContent: "center", gap: Spacing.three, marginVertical: Spacing.four },
  indicator: { flex: 1, maxWidth: PinLayout.indicatorWidth, height: PinLayout.indicatorHeight, borderWidth: 1, borderRadius: BorderRadius.md, justifyContent: "center", alignItems: "center" },
  dot: { width: 12, height: 12, borderRadius: BorderRadius.full },
  keypad: { width: "100%", maxWidth: PinLayout.keypadWidth, gap: PinLayout.rowGap },
  keyRow: { flexDirection: "row", justifyContent: "space-between", gap: Spacing.two },
  key: { flex: 1, minHeight: PinLayout.keyHeight, borderRadius: BorderRadius.lg, justifyContent: "center", alignItems: "center" },
  digit: { ...Typography.h1, fontSize: 26, lineHeight: 34 },
  disabled: { opacity: 0.45 },
});
