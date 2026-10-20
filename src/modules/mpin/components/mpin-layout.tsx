import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, PinLayout, Spacing, Typography } from "@/shared/theme";
import { BackArrowIcon } from "@/shared/ui/back-arrow-icon";
import { FormFeedback } from "@/shared/ui/form-feedback";
import { SuccessIndicator } from "@/shared/ui/success-indicator";

export function MpinLayout({ title, description, children, onBack, busy, error, preview = false, success = false }: {
  title: string; description: string; children: ReactNode; onBack?: () => void;
  busy?: boolean; error?: string | null; preview?: boolean; success?: boolean;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.toolbar}>
          {onBack && <Pressable onPress={onBack} disabled={busy} style={styles.back}
            feedbackRadius={16} feedbackInsets={{ top: 8, right: 6, bottom: 8, left: 6 }} feedbackBehindContent
            accessibilityRole="button" accessibilityLabel="Go back" accessibilityState={{ disabled: !!busy }}>
            <BackArrowIcon color={theme.text} />
          </Pressable>}
        </View>
        <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(220)} style={styles.body}>
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
      </ScrollView>
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
  back: { width: 44, height: 48, marginLeft: -Spacing.two, alignItems: "center", justifyContent: "center" },
  body: { flexGrow: 1 },
  intro: { alignItems: "center", marginTop: Spacing.four },
  icon: { width: 60, height: 60, borderRadius: BorderRadius.full, justifyContent: "center", alignItems: "center", marginBottom: Spacing.four },
  title: { ...Typography.h3, textAlign: "center", marginTop: Spacing.two },
  description: { ...Typography.bodySmall, textAlign: "center", marginTop: Spacing.two, maxWidth: 320 },
  feedback: { marginTop: Spacing.three },
  busy: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: Spacing.two, marginTop: Spacing.three },
});
