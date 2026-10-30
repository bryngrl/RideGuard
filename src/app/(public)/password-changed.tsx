import { Redirect, Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { BackHandler, View } from "react-native";
import { usePasswordChangeResult } from "@/modules/auth/store/password-change-result.store";
import { AuthFormLayout } from "@/shared/ui/auth-form-layout";
import { SuccessIndicator } from "@/shared/ui/success-indicator";
import { Button } from "@/shared/ui/button";
import { Spacing } from "@/shared/theme";

export default function PasswordChangedScreen() {
  const router = useRouter();
  const completed = usePasswordChangeResult((state) => state.completed);
  const login = useCallback(() => { usePasswordChangeResult.getState().clear(); router.dismissTo("/(public)/sign-in"); }, [router]);
  useFocusEffect(useCallback(() => {
    const back = BackHandler.addEventListener("hardwareBackPress", () => { login(); return true; });
    return () => back.remove();
  }, [login]));
  if (!completed) return <Redirect href="/(public)/sign-in" />;
  return <AuthFormLayout title="Password changed!" description="Your password has been updated. Sign in again with your new password." onBack={login}>
    <Stack.Screen options={{ gestureEnabled: false }} />
    <View style={{ alignItems: "center", gap: Spacing.four, marginTop: Spacing.five }}>
      <SuccessIndicator label="Password changed successfully" />
      <Button title="Back to login" onPress={login} />
    </View>
  </AuthFormLayout>;
}
