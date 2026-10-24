import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { signInWithEmailAndPassword, type User } from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Keyboard, Linking, StyleSheet, Text, View } from "react-native";

import { auth } from "@/lib/firebase";
import { useTheme } from "@/shared/hooks/use-theme";
import { FontFamily, Spacing, Typography } from "@/shared/theme";
import { AuthFormLayout } from "@/shared/ui/auth-form-layout";
import { Button } from "@/shared/ui/button";
import { CustomTextInput } from "@/shared/ui/text-input";
import { FormFeedback } from "@/shared/ui/form-feedback";

import { ensureEmailPasswordProfile } from "../services/auth.api";
import { postAuthDestination } from "../services/registration-progress";
import { sendVerificationForUser, verificationEmailMessage, VerificationEmailError } from "../services/verification-email";
import { useAuthStore } from "../store/auth.store";
import { authErrorMessage } from "../utils/auth-errors";

export default function CheckEmailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { email: routeEmail } = useLocalSearchParams<{ email?: string }>();
  const [enteredEmail, setEnteredEmail] = useState("");
  const email = typeof routeEmail === "string" && routeEmail.trim()
    ? routeEmail.trim().toLowerCase()
    : enteredEmail.trim().toLowerCase();
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [busy, setBusy] = useState<"check" | "resend" | null>(null);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [availableAt, setAvailableAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const pending = useRef(false);
  const seconds = Math.max(0, Math.ceil((availableAt - now) / 1000));

  useEffect(() => {
    if (!seconds) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const currentUser = () => {
    const user = auth.currentUser;
    return user && user.email?.toLowerCase() === email ? user : null;
  };

  const finishSignIn = useCallback(async (account: User) => {
    try {
      const hasProfile = await ensureEmailPasswordProfile(account);
      const destination = await postAuthDestination(account, hasProfile);
      useAuthStore.getState().setIsOldUser(hasProfile);
      useAuthStore.getState().setUser(account);
      setPassword("");
      router.replace(destination);
    } catch (error) {
      setVerified(true);
      setMessage(authErrorMessage(error, "login"));
      setIsError(true);
    }
  }, [router]);

  const checkStatus = useCallback(async () => {
    if (pending.current || !email) return;
    const user = currentUser();
    if (!user || AppState.currentState !== "active") return;
    pending.current = true;
    setBusy("check");
    try {
      await user.reload();
      if (user.emailVerified) await finishSignIn(user);
    } catch (error) {
      setMessage(authErrorMessage(error, "status"));
      setIsError(true);
    } finally {
      pending.current = false;
      setBusy(null);
    }
  }, [email, finishSignIn]);

  useFocusEffect(useCallback(() => {
    void checkStatus();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void checkStatus();
    });
    const timer = setInterval(() => void checkStatus(), 12_000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [checkStatus]));

  const resend = async () => {
    if (pending.current || seconds > 0 || !email) return;
    const user = currentUser();
    if (!user && !password) {
      setNeedsPassword(true);
      setMessage("Enter your password to resend the verification link.");
      setIsError(false);
      return;
    }
    pending.current = true;
    setBusy("resend");
    setMessage(null);
    Keyboard.dismiss();
    try {
      const account = user ?? (await signInWithEmailAndPassword(auth, email, password)).user;
      await account.reload();
      if (account.emailVerified) {
        await finishSignIn(account);
        return;
      }
      await sendVerificationForUser(account);
      setPassword("");
      setNeedsPassword(false);
      setMessage("Verification link sent. Check your inbox and spam folder.");
      setIsError(false);
      setAvailableAt(Date.now() + 60_000);
    } catch (error) {
      if (error instanceof VerificationEmailError && error.code === "auth/too-many-requests" ||
          error && typeof error === "object" && "code" in error && error.code === "auth/too-many-requests") {
        setAvailableAt(Date.now() + 60_000);
      }
      setMessage(verificationEmailMessage(error));
      setIsError(true);
    } finally {
      pending.current = false;
      setBusy(null);
    }
  };

  const openEmail = async () => {
    try {
      await Linking.openURL("mailto:");
    } catch {
      setMessage("Open your email app and find the RideGuard verification link. Check your spam folder too.");
      setIsError(false);
    }
  };

  const goToLogin = () => {
    setPassword("");
    Keyboard.dismiss();
    router.replace({ pathname: "/(public)/sign-in", params: { registrationEmail: email } });
  };

  return (
    <AuthFormLayout title="Check your email"
      description={<>We've sent a verification link to {email
        ? <Text style={{ color: theme.accent }}>{email}</Text>
        : "your email address"}. Open the link to verify your account.</>}
      onBack={goToLogin}>
      <View style={styles.body}>
        {!routeEmail ? <CustomTextInput label="Email address" value={enteredEmail} onChangeText={setEnteredEmail}
          autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" /> : null}
        {message ? <FormFeedback tone={isError ? "error" : "info"} message={message} /> : null}
        {needsPassword && !verified ? <CustomTextInput label="Password" value={password} onChangeText={setPassword}
          isPassword autoComplete="current-password" textContentType="password" returnKeyType="done"
          onSubmitEditing={resend} /> : null}
        {!verified ? <Button title="Open Email" onPress={openEmail} style={styles.primary} /> : null}
        {!verified ? <Button title={seconds ? `Resend in ${seconds}s` : "Resend Verification Link"}
          variant="outline" onPress={resend} isLoading={busy === "resend"} disabled={!!busy || seconds > 0} /> : null}
        <Pressable onPress={goToLogin} accessibilityRole="button" style={styles.link}>
          <Text style={[styles.linkText, { color: theme.accent }]}>Back to Login</Text>
        </Pressable>
      </View>
    </AuthFormLayout>
  );
}

const styles = StyleSheet.create({
  body: { gap: Spacing.three, marginTop: Spacing.five },
  primary: { marginTop: Spacing.two },
  link: { alignSelf: "center", padding: Spacing.two },
  linkText: { ...Typography.bodySmall, fontFamily: FontFamily.geistMedium },
});
