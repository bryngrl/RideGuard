import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { PinLayout, Spacing, Typography } from "@/shared/theme";

/** Shared six-digit email-code input for password and MPIN verification. */
export function VerificationCodeInput({ value, onChange, disabled = false, error = false }: {
  value: string; onChange: (value: string) => void; disabled?: boolean; error?: boolean;
}) {
  const theme = useTheme();
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  return <View style={styles.container}>
    <Pressable onPress={() => input.current?.focus()} disabled={disabled} style={styles.boxes}
      accessible={false} importantForAccessibility="no-hide-descendants">
      {Array.from({ length: 6 }, (_, index) => <View key={index} style={[styles.box, {
        backgroundColor: error ? theme.inputErrorBackground : theme.backgroundElement,
        borderColor: error ? theme.error : focused && index === Math.min(value.length, 5) ? theme.borderFocus : theme.border,
      }]}><Text style={[Typography.h3, { color: theme.text }]}>{value[index] ?? ""}</Text></View>)}
    </Pressable>
    <TextInput ref={input} value={value} onChangeText={(next) => onChange(next.replace(/\D/g, "").slice(0, 6))}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={styles.input} keyboardType="number-pad" autoComplete="one-time-code"
      textContentType="oneTimeCode" maxLength={6} editable={!disabled}
      accessibilityLabel="Six-digit email verification code" />
  </View>;
}

const styles = StyleSheet.create({
  container: { width: "100%", maxWidth: 304, alignSelf: "center", marginTop: Spacing.five },
  boxes: { flexDirection: "row", gap: Spacing.two },
  box: { flex: 1, height: PinLayout.indicatorHeight, borderWidth: 1, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  input: { position: "absolute", width: 1, height: 1, opacity: 0 },
});
