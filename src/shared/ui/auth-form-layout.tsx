import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import MainLogo from "@/assets/icons/logos/main.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { actionFooterPadding, Spacing, Typography } from "@/shared/theme";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareFormScrollView } from "./keyboard-aware-form-scroll-view";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { BACK_ARROW_TOUCH_LEFT, BACK_ARROW_TOUCH_SIZE, BackArrowIcon } from "./back-arrow-icon";

interface AuthFormLayoutProps {
  title: string;
  description: ReactNode;
  onBack: () => void;
  backDisabled?: boolean;
  showBack?: boolean;
  variant?: "branded" | "recovery";
  children: ReactNode;
  notification?: ReactNode;
}

/** Shared auth layouts: branded forms and the compact Find Your Account format. */
export function AuthFormLayout({ title, description, onBack, backDisabled, showBack = true, variant = "branded", children, notification }: AuthFormLayoutProps) {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const recovery = variant === "recovery";
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <KeyboardAwareFormScrollView
          contentContainerStyle={[styles.content, { paddingBottom: actionFooterPadding(bottom, true) }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          keyboardGap={Spacing.four}
        >
          {showBack ? <Pressable
            onPress={onBack}
            disabled={backDisabled}
            style={styles.backButton}
            feedbackRadius={16}
            feedbackInsets={Spacing.two}
            feedbackBehindContent
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityState={{ disabled: !!backDisabled }}
          >
            <BackArrowIcon color={theme.text} />
          </Pressable> : <View style={styles.backButton} />}
          {!recovery && <View style={styles.brand}><MainLogo width={64} height={64} /></View>}
          <View style={recovery ? styles.recoveryMain : undefined}>
            <Text accessibilityRole="header" style={[recovery ? styles.recoveryHeading : styles.heading, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.description, recovery && styles.recoveryDescription, { color: theme.textMuted }]}>{description}</Text>
            {children}
          </View>
        </KeyboardAwareFormScrollView>
      </KeyboardAvoidingView>
      {notification}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1, width: "100%", maxWidth: 440, alignSelf: "center",
    paddingHorizontal: Spacing.five, paddingTop: Spacing.two, paddingBottom: Spacing.five,
  },
  backButton: { width: BACK_ARROW_TOUCH_SIZE, height: BACK_ARROW_TOUCH_SIZE, marginLeft: BACK_ARROW_TOUCH_LEFT - Spacing.five, alignItems: "center", justifyContent: "center" },
  brand: { alignSelf: "flex-start", marginTop: Spacing.six, marginBottom: Spacing.four },
  heading: { ...Typography.h1 },
  description: { ...Typography.bodySmall, marginTop: Spacing.two },
  recoveryMain: { marginTop: Spacing.four },
  recoveryHeading: { ...Typography.h3 },
  recoveryDescription: { marginTop: Spacing.one },
});
