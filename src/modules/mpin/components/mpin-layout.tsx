import { Ionicons } from "@expo/vector-icons";
import { useEffect, type ReactNode } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/shared/hooks/use-theme";
import { actionFooterPadding, BorderRadius, PinLayout, Spacing, Typography } from "@/shared/theme";
import { FormFeedback } from "@/shared/ui/form-feedback";
import { KeyboardAwareFormScrollView } from "@/shared/ui/keyboard-aware-form-scroll-view";
import { SuccessIndicator } from "@/shared/ui/success-indicator";
import Stepper from "@/shared/ui/stepper";
import { MpinNotification } from "./mpin-notification";

export function MpinLayout({ title, description, children, busy, error, preview = false, success = false, onboarding = false }: {
  title: string; description: string; children: ReactNode; onBack?: () => void;
  busy?: boolean; error?: string | null; preview?: boolean; success?: boolean;
  onboarding?: boolean;
}) {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: reducedMotion ? 0 : 220 });
    return () => cancelAnimation(opacity);
  }, [opacity, reducedMotion]);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <KeyboardAwareFormScrollView contentContainerStyle={[styles.content, { paddingBottom: actionFooterPadding(bottom, true) }]} keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false} keyboardGap={Spacing.four} removeClippedSubviews={false}>
          {onboarding && <Stepper currentStep={9} steps={10} />}
          <View style={styles.toolbar} />
          <Animated.View collapsable={false} style={[styles.body, fade]}>
            <View style={styles.intro}>
              {success ? <SuccessIndicator label={preview ? "Success screen preview" : title} /> :
                <View style={[styles.icon, { backgroundColor: theme.infoBackground }]}><Ionicons name="shield-checkmark-outline" size={28} color={theme.text} /></View>}
              <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.description, { color: theme.textMuted }]}>{description}</Text>
            </View>
            {preview && <View style={styles.feedback}><FormFeedback tone="info" message="Design preview only. No MPIN is saved, verified, or used to unlock your account." /></View>}
            {error && <View style={styles.feedback}><FormFeedback message={error} /></View>}
            {busy && <View style={styles.busy} accessible accessibilityLabel="Processing MPIN request" accessibilityLiveRegion="polite">
              <ActivityIndicator color={theme.text} /><Text style={[Typography.bodySmall, { color: theme.textMuted }]}>Please wait…</Text>
            </View>}
            {children}
          </Animated.View>
        </KeyboardAwareFormScrollView>
      </KeyboardAvoidingView>
      <MpinNotification error={error} success={success ? title : undefined} />
    </SafeAreaView>
  );
}

export const mpinStyles = StyleSheet.create({
  actions: { gap: Spacing.three, marginTop: Spacing.five },
  secondary: { marginTop: PinLayout.actionGap },
  note: { ...Typography.bodySmall, textAlign: "center", marginTop: Spacing.three },
  field: { marginTop: Spacing.four },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, width: "100%", maxWidth: 440, alignSelf: "center", paddingHorizontal: Spacing.five, paddingTop: Spacing.two, paddingBottom: Spacing.four },
  toolbar: { height: 48 },
  body: { flexGrow: 1 },
  intro: { alignItems: "center", marginTop: Spacing.four },
  icon: { width: 60, height: 60, borderRadius: BorderRadius.full, justifyContent: "center", alignItems: "center", marginBottom: Spacing.four },
  title: { ...Typography.h3, textAlign: "center", marginTop: Spacing.two },
  description: { ...Typography.bodySmall, textAlign: "center", marginTop: Spacing.two, maxWidth: 320 },
  feedback: { marginTop: Spacing.three },
  busy: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: Spacing.two, marginTop: Spacing.three },
});
