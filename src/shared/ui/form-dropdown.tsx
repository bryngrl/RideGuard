import { Ionicons } from "@expo/vector-icons";
import { Keyboard, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, useReducedMotion } from "react-native-reanimated";
import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { CustomTextInput } from "./text-input";
import { FeedbackPressable as Pressable } from "./feedback-pressable";

/** The Emergency Contact selector's field, caret and selected-check pattern. */
export function FormDropdown({ label, value, options, onChange, open, onOpenChange, error, placeholder, required, disabled = false }: {
  label: string; value: string; options: readonly { label: string; value: string }[];
  onChange: (value: string) => void; open: boolean; onOpenChange: (open: boolean) => void;
  error?: string; placeholder?: string; required?: boolean; disabled?: boolean;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  return <View style={styles.container} accessibilityState={{ expanded: open, disabled }}>
    <CustomTextInput label={label} required={required} value={value} error={error} placeholder={placeholder}
      editable={false} onFieldPress={disabled ? undefined : () => { Keyboard.dismiss(); onOpenChange(!open); }}
      inputWrapperStyle={open ? { borderColor: theme.accent, backgroundColor: theme.backgroundSelected } : undefined}
      rightIcon={<Ionicons name={open ? "caret-up" : "caret-down"} size={20} color={theme.textMuted} />}
      containerStyle={{ paddingBottom: 0 }} />
    {open && !disabled && <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(140)}
      exiting={reducedMotion ? undefined : FadeOut.duration(100)}
      style={[styles.menu, { backgroundColor: theme.inputBackground, borderColor: error ? theme.error : theme.border }]}>
      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.options}>
        {options.map((item) => <Pressable key={item.value} style={[styles.item, value === item.value && { backgroundColor: theme.backgroundSelected }]}
          feedbackRadius={0} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: value === item.value }}
          onPress={() => { onChange(item.value); onOpenChange(false); }}>
          <Text style={[Typography.input, { color: theme.text }]}>{item.label}</Text>
          {value === item.value && <Ionicons name="checkmark" size={20} color={theme.text} />}
        </Pressable>)}
      </ScrollView>
    </Animated.View>}
  </View>;
}

const styles = StyleSheet.create({
  container: { position: "relative", zIndex: 10, paddingBottom: Spacing.two },
  menu: { borderWidth: 1, borderRadius: BorderRadius.lg, marginTop: Spacing.two, overflow: "hidden" },
  options: { maxHeight: 240 },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, minHeight: 46 },
});
