import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Keyboard, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { Button } from "@/shared/ui/button";
import { AuthFormLayout } from "@/shared/ui/auth-form-layout";
import { CustomTextInput } from "@/shared/ui/text-input";

import { requestPasswordReset } from "../services/auth.api";
import { styles } from "./forgot-password-screen.styles";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const sending = useRef(false);

  const trimmedEmail = email.trim();
  const emailError = !trimmedEmail
    ? "Enter your email address."
    : !emailPattern.test(trimmedEmail)
      ? "Enter a valid email address."
      : undefined;

  const handleSend = async () => {
    if (sending.current) return;
    setSubmitted(true);
    setRequestError(null);
    if (emailError) return;

    Keyboard.dismiss();
    sending.current = true;
    setLoading(true);
    try {
      await requestPasswordReset(trimmedEmail.toLowerCase());
      setSent(true);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to send the reset link. Try again.");
    } finally {
      sending.current = false;
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
      description="Enter your email address and we’ll send a password reset link."
      onBack={goBack}
    >
      <View style={styles.form}>
        <CustomTextInput
          label="Email address"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setRequestError(null);
            setSent(false);
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

        <Button title={sent ? "Send another link" : "Send reset link"} onPress={handleSend} isLoading={loading} style={styles.sendButton} />
        {sent ? (
          <Text accessibilityRole="alert" style={[styles.feedback, { color: theme.text }]}>
            If an account exists for this email, a Firebase password reset link has been sent. Open it to set a new password, then return to login.
          </Text>
        ) : null}
        {requestError && (
          <Text accessibilityRole="alert" style={[styles.feedback, { color: theme.error }]}>
            {requestError}
          </Text>
        )}
        {sent ? <Button title="Back to login" variant="ghost" onPress={() => router.replace("/(public)/sign-in")} /> : null}
      </View>
    </AuthFormLayout>
  );
}
