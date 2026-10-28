import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Keyboard, Text, View } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";
import { Button } from "@/shared/ui/button";
import { AuthFormLayout } from "@/shared/ui/auth-form-layout";
import { CustomTextInput } from "@/shared/ui/text-input";
import { EmailLinkContent } from "@/shared/ui/email-link-content";
import { FormFeedback } from "@/shared/ui/form-feedback";
import { NotificationSheet } from "@/shared/ui/notification-sheet";
import { APIError } from "@/shared/api/errors";

import { requestPasswordReset } from "../services/auth.api";
import { usePasswordRecoveryStore } from "../store/password-recovery.store";
import { styles } from "./forgot-password-screen.styles";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { linkError } = useLocalSearchParams<{ linkError?: string }>();
  const theme = useTheme();
  const recovery = usePasswordRecoveryStore();
  const [email, setEmail] = useState(recovery.requestedEmail ?? "");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [sent, setSent] = useState(!!recovery.requestedEmail);
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const sending = useRef(false);
  const active = useRef(false);
  const hideNotice = useCallback(() => setNotice(null), []);
  const seconds = Math.max(0, Math.ceil((recovery.resendAt - now) / 1000));

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!linkError) return;
    setRequestError(linkError === "network" ? "Couldn't verify the link. Check your connection." : "Reset link expired or invalid. Request a new link.");
    router.setParams({ linkError: undefined });
  }, [linkError, router]);

  const goBack = useCallback(() => {
    if (sending.current) return;
    Keyboard.dismiss();
    if (sent) { setSent(false); return; }
    if (router.canGoBack()) router.back();
    else router.replace("/(public)/sign-in");
  }, [router, sent]);

  useFocusEffect(useCallback(() => {
    active.current = true;
    if (!sending.current) setLoading(false);
    const back = BackHandler.addEventListener("hardwareBackPress", () => { goBack(); return true; });
    return () => { active.current = false; back.remove(); };
  }, [goBack]));

  const trimmedEmail = email.trim().toLowerCase();
  const emailError = !trimmedEmail ? "Enter your email address." : !emailPattern.test(trimmedEmail) ? "Enter a valid email address." : undefined;

  const handleSend = async () => {
    if (sending.current || Date.now() < usePasswordRecoveryStore.getState().resendAt) return;
    setSubmitted(true);
    setRequestError(null);
    if (emailError) return;
    Keyboard.dismiss();
    sending.current = true;
    setLoading(true);
    try {
      await requestPasswordReset(trimmedEmail);
      usePasswordRecoveryStore.getState().markRequested(trimmedEmail, Date.now() + 60_000);
      if (!active.current) return;
      if (sent) setNotice({ message: "Password reset email sent successfully.", type: "success" });
      setSent(true);
    } catch (error) {
      const message = error instanceof APIError && error.status === 429 ? "Too many requests. Try again later." :
        error instanceof TypeError ? "Connection lost. Try again." : "Couldn't send reset link. Try again.";
      if (active.current) {
        if (sent) setNotice({ message, type: "error" });
        else setRequestError(message);
      }
    } finally {
      sending.current = false;
      if (active.current) { setLoading(false); setNow(Date.now()); }
    }
  };

  const notification = <NotificationSheet visible={!!notice} message={notice?.message ?? ""} type={notice?.type} onHide={hideNotice} />;

  if (sent) return <AuthFormLayout title="Check your email" onBack={goBack} backDisabled={loading}
    description={<>If an account exists, we've sent a reset link to{"\n"}<Text style={{ color: theme.accent }}>{recovery.requestedEmail ?? trimmedEmail}</Text></>}
    notification={notification}>
    {requestError && <FormFeedback message={requestError} />}
    <EmailLinkContent instruction="Tap the link in your email to reset your password."
      status="You'll create a new password after verifying the link." onResend={handleSend} seconds={seconds} sending={loading} />
  </AuthFormLayout>;

  return <AuthFormLayout variant="recovery" title="Find your account"
    description="Enter your email address and we'll send a password reset link." onBack={goBack} backDisabled={loading} notification={notification}>
    <View style={styles.form}>
      <CustomTextInput label="Email address" value={email}
        onChangeText={(value) => { setEmail(value); setRequestError(null); }} onBlur={() => setTouched(true)}
        error={touched || submitted ? emailError : undefined} autoCapitalize="none" autoCorrect={false}
        autoComplete="email" keyboardType="email-address" returnKeyType="done" onSubmitEditing={handleSend}
        containerStyle={styles.field} inputWrapperStyle={styles.inputWrapper} />
      {requestError && <FormFeedback message={requestError} />}
      <Button title={seconds ? `Send reset link (${seconds}s)` : "Send reset link"} onPress={handleSend}
        isLoading={loading} disabled={seconds > 0} style={styles.sendButton} />
    </View>
  </AuthFormLayout>;
}
