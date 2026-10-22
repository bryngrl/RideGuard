import { Redirect, Stack, useFocusEffect, useNavigation } from "expo-router";
import { useCallback } from "react";
import { BackHandler, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { SuccessIndicator } from "@/shared/ui/success-indicator";

import { usePasswordRecoveryStore } from "../store/password-recovery.store";

export default function PasswordResetSuccessScreen() {
  const theme = useTheme();
  const navigation = useNavigation("/");
  const completed = usePasswordRecoveryStore((state) => state.completed);
  const backToLogin = useCallback(() => {
    navigation.dispatch({
      type: "RESET",
      payload: {
        index: 1,
        routes: [{ name: "(public)/welcome" }, { name: "(public)/sign-in" }],
      },
    });
  }, [navigation]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => { backToLogin(); return true; });
    return () => {
      subscription.remove();
      usePasswordRecoveryStore.getState().clear();
    };
  }, [backToLogin]));

  if (!completed) return <Redirect href="/(public)/sign-in" />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.message}>
          <SuccessIndicator label="Password changed successfully" />
          <Text accessibilityRole="header" style={[styles.heading, { color: theme.text }]}>Password changed!</Text>
          <Text style={[styles.description, { color: theme.textMuted }]}>
            Your password has been updated successfully. You can now log in with your new password.
          </Text>
        </View>
        <Button title="Back to Login" onPress={backToLogin} style={styles.button} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, width: "100%", maxWidth: 440, alignSelf: "center", paddingHorizontal: Spacing.five, paddingVertical: Spacing.five },
  message: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: Spacing.six },
  heading: { ...Typography.h1, textAlign: "center", marginTop: Spacing.four },
  description: { ...Typography.bodySmall, textAlign: "center", marginTop: Spacing.three },
  button: { height: 42, marginTop: Spacing.four, marginBottom: Spacing.three },
});
