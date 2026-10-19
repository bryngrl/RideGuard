import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, BackHandler, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/shared/hooks/use-theme";
import { Button } from "@/shared/ui/button";
import { BackArrowIcon } from "@/shared/ui/back-arrow-icon";
import { VerificationCodeInput } from "@/shared/ui/verification-code-input";

import {
  recoveryMessage,
  resendResetCode,
  verifyResetCode,
  type CodeDelivery,
} from "../services/password-recovery";
import { styles } from "./verify-code-screen.styles";
import { isResetSessionValid, usePasswordRecoveryStore } from "../store/password-recovery.store";

const CODE_LENGTH = 6;

export default function VerifyCodeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    destination?: string;
    expiresAt?: string;
    resendAt?: string;
    preview?: string;
  }>();
  const destination = params.destination ?? "";
  const preview = __DEV__ && params.preview === "1";
  const initialExpiry = Number(params.expiresAt);
  const initialResend = Number(params.resendAt);
  const [delivery, setDelivery] = useState<CodeDelivery | null>(
    !preview && initialExpiry > Date.now() && initialResend > 0
      ? { expiresAt: initialExpiry, resendAt: initialResend }
      : null,
  );
  const [now, setNow] = useState(Date.now());
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const requestPending = useRef(false);
  const active = useRef(true);
  const session = usePasswordRecoveryStore((state) => state.session);
  const verified = session?.destination === destination && isResetSessionValid(session, now);

  useFocusEffect(useCallback(() => {
    active.current = true;
    if (!requestPending.current) {
      setIsVerifying(false);
      setIsResending(false);
    }
    setNow(Date.now());
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => requestPending.current);
    return () => {
      active.current = false;
      setCode("");
      subscription.remove();
    };
  }, []));

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    const subscription = AppState.addEventListener("change", (state) => {
      setNow(Date.now());
      if (state !== "active") setCode("");
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [delivery, session]);

  const expired = !!delivery && now >= delivery.expiresAt;
  const resendSeconds = delivery
    ? Math.max(0, Math.ceil((delivery.resendAt - now) / 1000))
    : 0;

  useEffect(() => {
    if (active.current && session && !isResetSessionValid(session, now)) {
      usePasswordRecoveryStore.getState().clear();
    }
  }, [session, now]);

  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    setError(null);
    if (digits.length === CODE_LENGTH) Keyboard.dismiss();
  };

  const handleConfirm = async () => {
    if (requestPending.current) return;
    Keyboard.dismiss();
    if (session?.destination === destination && isResetSessionValid(session)) {
      router.push("/(public)/new-password");
      return;
    }
    if (code.length !== CODE_LENGTH) {
      setError("Enter the complete six-digit code.");
      return;
    }
    if (preview) {
      setCode("");
      router.push({ pathname: "/(public)/new-password", params: { preview: "1" } });
      return;
    }
    if (!delivery) {
      setError("No code has been sent. Password recovery is not connected yet.");
      return;
    }
    if (Date.now() >= delivery.expiresAt) {
      setError("That code has expired. Request a new code.");
      return;
    }

    requestPending.current = true;
    setIsVerifying(true);
    setError(null);
    try {
      const result = await verifyResetCode(destination, code);
      if (!active.current) return;
      if (!usePasswordRecoveryStore.getState().setVerifiedSession(destination, result)) {
        setError("Your reset session is invalid or expired. Request a new code.");
        return;
      }
      setCode("");
      router.push("/(public)/new-password");
    } catch (reason) {
      if (active.current) setError(recoveryMessage(reason));
    } finally {
      requestPending.current = false;
      if (active.current) setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (requestPending.current || resendSeconds > 0) return;
    Keyboard.dismiss();
    requestPending.current = true;
    setIsResending(true);
    setError(null);
    try {
      const next = await resendResetCode(destination);
      if (!active.current) return;
      setDelivery(next);
      setNow(Date.now());
      setCode("");
    } catch (reason) {
      if (active.current) setError(recoveryMessage(reason));
    } finally {
      requestPending.current = false;
      if (active.current) setIsResending(false);
    }
  };

  const backToRecovery = () => {
    if (requestPending.current) return;
    Keyboard.dismiss();
    setCode("");
    usePasswordRecoveryStore.getState().clear();
    if (router.canGoBack()) router.back();
    else router.replace("/(public)/forgot-password");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ gestureEnabled: !isVerifying && !isResending }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={backToRecovery}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            disabled={isVerifying || isResending}
          >
            <BackArrowIcon color={theme.text} />
          </Pressable>
          <View style={styles.main}>
            <Text style={[styles.heading, { color: theme.text }]}>
              Enter your confirmation code{"\n"}to reset your password
            </Text>
            <Text style={[styles.description, { color: theme.textMuted }]}>
              {verified
                ? "Your code is verified. Continue to create a new password."
                : delivery
                ? "An email was sent to the address connected to this account."
                : preview
                  ? "Design preview only. Enter any six digits to view the new-password design. No code is sent or verified."
                  : "Code delivery is not connected yet."}
            </Text>

            {!verified && <VerificationCodeInput value={code} onChange={handleCodeChange}
              disabled={isVerifying || isResending} error={!!error || expired} />}

            {error && (
              <Text accessibilityRole="alert" style={[styles.feedback, { color: theme.error }]}>
                {error}
              </Text>
            )}
            {!verified && expired && !error && (
              <Text accessibilityRole="alert" style={[styles.feedback, { color: theme.error }]}>
                That code has expired. Request a new code.
              </Text>
            )}
            <Button
              title={preview ? "Preview new password" : verified ? "Continue" : "Confirm"}
              onPress={handleConfirm}
              isLoading={isVerifying}
              disabled={isResending}
              style={styles.confirmButton}
            />
            {!verified && <View style={styles.resendRow}>
              <Text style={[styles.resendPrompt, { color: theme.textMuted }]}>
                Didn’t get code?{' '}
              </Text>
              <Pressable
                onPress={handleResend}
                disabled={resendSeconds > 0 || isResending || isVerifying}
                accessibilityRole="button"
                accessibilityState={{ disabled: resendSeconds > 0 || isResending || isVerifying }}
              >
                <Text
                  style={[
                    styles.resendLink,
                    { color: resendSeconds > 0 ? theme.textMuted : theme.accent },
                  ]}
                >
                  {isResending
                    ? "Resending…"
                    : resendSeconds > 0
                      ? `Resend in ${resendSeconds}s`
                      : "Resend Code"}
                </Text>
              </Pressable>
            </View>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
