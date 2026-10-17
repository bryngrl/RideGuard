import MainLogo from "@/assets/icons/logos/main.svg";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackArrowIcon } from "./back-arrow-icon";

interface AuthFormLayoutProps {
  title: string;
  description: string;
  onBack: () => void;
  backDisabled?: boolean;
  variant?: "branded" | "recovery";
  children: ReactNode;
}

/** Shared auth layouts: branded forms and the compact Find Your Account format. */
export function AuthFormLayout({ title, description, onBack, backDisabled, variant = "branded", children }: AuthFormLayoutProps) {
  const theme = useTheme();
  const recovery = variant === "recovery";
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={onBack}
            disabled={backDisabled}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityState={{ disabled: !!backDisabled }}
          >
            <BackArrowIcon color={theme.text} />
          </Pressable>
          {!recovery && <View style={styles.brand}><MainLogo width={64} height={64} /></View>}
          <View style={recovery ? styles.recoveryMain : undefined}>
            <Text accessibilityRole="header" style={[recovery ? styles.recoveryHeading : styles.heading, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.description, recovery && styles.recoveryDescription, { color: theme.textMuted }]}>{description}</Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1, width: "100%", maxWidth: 440, alignSelf: "center",
    paddingHorizontal: Spacing.five, paddingTop: Spacing.two, paddingBottom: Spacing.five,
  },
  backButton: { width: 44, height: 48, marginLeft: -Spacing.two, alignItems: "flex-start", justifyContent: "center" },
  brand: { alignSelf: "flex-start", marginTop: Spacing.six, marginBottom: Spacing.four },
  heading: { ...Typography.h1 },
  description: { ...Typography.bodySmall, marginTop: Spacing.two },
  recoveryMain: { marginTop: Spacing.four },
  recoveryHeading: { ...Typography.h3 },
  recoveryDescription: { marginTop: Spacing.one },
});
