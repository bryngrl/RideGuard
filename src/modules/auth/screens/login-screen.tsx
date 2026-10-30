import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, TextInput, View } from "react-native";
import { KeyboardAwareFormScrollView } from "@/shared/ui/keyboard-aware-form-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

import MainLogo from "@/assets/icons/logos/main.svg";
import { ThemedText } from "@/components/themed-text";
import { auth } from "@/lib/firebase";

import { useGoogleSignin } from "../hooks/use-google-signin";

import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { BackArrowIcon } from "@/shared/ui/back-arrow-icon";
import { GoogleButton } from "@/shared/ui/google-button";
import { CustomTextInput } from "@/shared/ui/text-input";
import { FormFeedback } from "@/shared/ui/form-feedback";

import { checkIsOldUser, ensureEmailPasswordProfile, loginAccount } from "../services/auth.api";
import { postAuthDestination } from "../services/registration-progress";
import { authErrorMessage, isUnverifiedAccount, unverifiedAccountEmail } from "../utils/auth-errors";
import { useAuthStore } from "../store/auth.store";
import { isTemporarySessionFailure } from "../utils/session-errors";

import { styles } from "./login-screen.styles";
import { beginVerifiedSuccess, getVerifiedSuccess } from "../services/verified-success";
import { refreshFirebaseUser } from "../services/firebase-user-refresh";
import { traceLoginStage } from "../utils/auth-diagnostics";
import { useRegistrationDraft } from "../store/registration-draft.store";


export default function LoginScreen() {
  const router = useRouter();
  const { registrationEmail } = useLocalSearchParams<{ registrationEmail?: string }>();
  const theme = useTheme();

  const { signIn, isNewAccount } = useGoogleSignin();

  const passwordRef = useRef<TextInput>(null);
  const [username, setUsername] = useState(registrationEmail ?? "");
  const [password, setPassword] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [isCredentialLoading, setIsCredentialLoading] = useState(false);
  const credentialPending = useRef(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googlePending = useRef(false);

  const usernameError =
    (submitted || usernameTouched) && !username.trim()
      ? "Enter your username."
      : undefined;
  const passwordError =
    (submitted || passwordTouched) && !password.trim()
      ? "Enter your password."
      : undefined;

  const handleCredentialSignIn = async () => {
    if (credentialPending.current || googlePending.current) return;
    setSubmitted(true);
    setCredentialError(null);
    setVerificationEmail(null);

    if (!username.trim() || !password.trim()) {
      return;
    }

    Keyboard.dismiss();
    credentialPending.current = true;
    setIsCredentialLoading(true);
    let signedInWithPassword = false;
    try {
      const identity = await traceLoginStage("backend-login", () => loginAccount(username.trim(), password));
      const credential = await traceLoginStage("firebase-sign-in", () => signInWithEmailAndPassword(auth, identity.email, password));
      signedInWithPassword = true;
      await traceLoginStage("account-refresh", () => refreshFirebaseUser(credential.user));
      if (!credential.user.emailVerified) {
        setVerificationEmail(identity.email);
        setCredentialError("Email not verified. Check your inbox.");
        return;
      }
      const hasProfile = await traceLoginStage("profile-check", () => ensureEmailPasswordProfile(credential.user));
      const destination = await traceLoginStage("session-routing", () => postAuthDestination(credential.user, hasProfile));
      useAuthStore.getState().setUser(credential.user);
      useAuthStore.getState().setIsOldUser(hasProfile);
      if (useRegistrationDraft.getState().verificationEmail?.toLowerCase() === credential.user.email?.toLowerCase()) useRegistrationDraft.getState().clear();
      router.replace(getVerifiedSuccess()?.uid === credential.user.uid
        ? "/(public)/account-verified" : destination);
    } catch (error) {
      if (signedInWithPassword && !isTemporarySessionFailure(error)) await signOut(auth).catch(() => undefined);
      if (isUnverifiedAccount(error)) setVerificationEmail(unverifiedAccountEmail(error, username));
      setCredentialError(authErrorMessage(error, "login"));
    } finally {
      credentialPending.current = false;
      setIsCredentialLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googlePending.current || credentialPending.current) return;
    googlePending.current = true;
    setCredentialError(null);
    setVerificationEmail(null);
    try {
      setIsGoogleLoading(true);

      const user = await signIn();

      if (user) {
        const firebaseToken = await user.getIdToken();
        const isOldUser = await checkIsOldUser(firebaseToken);

        const destination = await postAuthDestination(user, isOldUser);
        if (auth.currentUser?.uid !== user.uid) return;
        if (isNewAccount() && !isOldUser && user.emailVerified) {
          beginVerifiedSuccess(user.uid, destination);
          router.replace("/(public)/account-verified");
        } else router.replace(destination);
      }
    } catch (error) {
      setCredentialError(authErrorMessage(error, "login"));
    } finally {
      googlePending.current = false;
      setIsGoogleLoading(false);
    }
  };

  const goBack = () => {
    Keyboard.dismiss();
    if (router.canGoBack()) router.back();
    else router.replace("/(public)/welcome");
  };

  const continueVerification = async () => {
    if (credentialPending.current || googlePending.current) return;
    if (!verificationEmail || !password) {
      setCredentialError("Enter your registered email and password.");
      return;
    }
    useRegistrationDraft.getState().update({ email: verificationEmail, verificationEmail, password });
    router.push({ pathname: "/(public)/check-email", params: { email: verificationEmail } });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <KeyboardAwareFormScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          keyboardGap={Spacing.four}
        >
          <Pressable onPress={goBack} style={styles.backButton} feedbackRadius={16} feedbackInsets={Spacing.two} feedbackBehindContent accessibilityRole="button" accessibilityLabel="Back to welcome">
            <BackArrowIcon color={theme.text} />
          </Pressable>
          <View style={styles.brand}><MainLogo color={theme.logo} width={64} height={64} /></View>
          <View style={styles.introSection}>
            <ThemedText style={[styles.title, { color: theme.text }]}>Log in</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>Enter your credentials or continue with Google.</ThemedText>
            {credentialError ? <View style={styles.feedback}><FormFeedback message={credentialError} /></View> : null}
            {verificationEmail !== null ? <Pressable onPress={continueVerification} disabled={isCredentialLoading} accessibilityRole="button" style={styles.verifyLink}>
              <ThemedText style={[styles.forgotText, { color: theme.accent }]}>Verify email with a code</ThemedText>
            </Pressable> : null}
          </View>
          <View style={styles.formSection}>
            <View style={styles.fields}>
              <CustomTextInput
                label="Username or email"
                required
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  setCredentialError(null);
                  setVerificationEmail(null);
                }}
                onBlur={() => setUsernameTouched(true)}
                error={usernameError}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                inputWrapperStyle={styles.inputWrapper}
                inputStyle={styles.input}
                containerStyle={styles.field}
              />
              <CustomTextInput
                ref={passwordRef}
                label="Password"
                required
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setCredentialError(null);
                }}
                onBlur={() => setPasswordTouched(true)}
                error={passwordError}
                isPassword
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleCredentialSignIn}
                inputWrapperStyle={styles.inputWrapper}
                inputStyle={styles.input}
                containerStyle={styles.field}
              />
              <View style={styles.recoveryRow}>
                <Pressable
                  onPress={() => router.push("/(public)/forgot-password")}
                  style={styles.forgotButton}
                  accessibilityRole="button"
                >
                  <ThemedText style={[styles.forgotText, { color: theme.accent }]}>Forgot password?</ThemedText>
                </Pressable>
              </View>
            </View>

            <Button
              title="Log in"
              onPress={handleCredentialSignIn}
              isLoading={isCredentialLoading}
              disabled={isGoogleLoading}
              style={styles.loginButton}
            />
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <ThemedText style={[styles.dividerText, { color: theme.textMuted }]}>
                OR
              </ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>
            <GoogleButton
              title="Continue with Google"
              isLoading={isGoogleLoading}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading || isCredentialLoading}
              style={styles.googleButton}
            />

            <View style={styles.legalContainer}>
              <ThemedText
                style={[
                  styles.legalText,
                  {
                    color: theme.textMuted,
                  },
                ]}
              >
                By continuing, you agree to our{" "}
                <ThemedText
                  onPress={() => router.push("/terms/terms")}
                  style={[styles.legalLink, { color: theme.accent }]}
                >
                  Terms of service
                </ThemedText>
                {"\n and "}
                <ThemedText
                  onPress={() => router.push("/privacy/privacy")}
                  style={[styles.legalLink, { color: theme.accent }]}
                >
                  Privacy Policy
                </ThemedText>
                .
              </ThemedText>
            </View>
          </View>
        </KeyboardAwareFormScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
