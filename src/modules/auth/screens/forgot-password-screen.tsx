import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Keyboard, Pressable, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { Button } from "@/shared/ui/button";
import { AuthFormLayout } from "@/shared/ui/auth-form-layout";
import { CustomTextInput } from "@/shared/ui/text-input";

import { RecoveryError, recoveryMessage, requestResetCode } from "../services/password-recovery";
import { styles } from "./forgot-password-screen.styles";
import { usePasswordRecoveryStore } from "../store/password-recovery.store";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [previewAvailable, setPreviewAvailable] = useState(false);

  // Starting over invalidates any previous verified token held in memory.
  useFocusEffect(useCallback(() => {
    usePasswordRecoveryStore.getState().clear();
  }, []));

  const trimmedEmail = email.trim();
  const emailError = !trimmedEmail
    ? "Enter your email address."
    : !emailPattern.test(trimmedEmail)
      ? "Enter a valid email address."
      : undefined;

  const handleSend = async () => {
    if (loading) return;
    setSubmitted(true);
    setRequestError(null);
    setPreviewAvailable(false);
    if (emailError) return;

    Keyboard.dismiss();
    setLoading(true);
    try {
      const delivery = await requestResetCode(trimmedEmail);
      router.push({
        pathname: "/(public)/verify-code",
        params: {
          destination: trimmedEmail,
          expiresAt: String(delivery.expiresAt),
          resendAt: String(delivery.resendAt),
        },
      });
    } catch (error) {
      setRequestError(recoveryMessage(error));
      setPreviewAvailable(error instanceof RecoveryError && error.code === "unavailable");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    Keyboard.dismiss();
    if (router.canGoBack()) router.back();
    else router.replace("/(public)/sign-in");
  };

  return (
    <AuthFormLayout
      variant="recovery"
      title="Find your account"
      description="Please enter your email address to reset your password."
      onBack={goBack}
    >
      <View style={styles.form}>
        <CustomTextInput
          label="Email address"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setRequestError(null);
            setPreviewAvailable(false);
          }}
          onBlur={() => setTouched(true)}
          error={touched || submitted ? emailError : undefined}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="done"
          onSubmitEditing={handleSend}
          containerStyle={styles.field}
          inputWrapperStyle={styles.inputWrapper}
        />

        <Button title="Send code" onPress={handleSend} isLoading={loading} style={styles.sendButton} />
        {requestError && (
          <Text accessibilityRole="alert" style={[styles.feedback, { color: theme.error }]}>
            {requestError}
          </Text>
        )}
        {__DEV__ && previewAvailable && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(public)/verify-code",
                params: { destination: trimmedEmail, preview: "1" },
              })
            }
            style={styles.previewButton}
            accessibilityRole="button"
          >
            <Text style={[styles.previewText, { color: theme.accent }]}>
              Preview code screen (no code was sent)
            </Text>
          </Pressable>
        )}
      </View>
    </AuthFormLayout>
  );
}
