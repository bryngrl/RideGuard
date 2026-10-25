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
import { authErrorMessage, isUnverifiedAccount } from "../utils/auth-errors";
import { useAuthStore } from "../store/auth.store";

import { styles } from "./login-screen.styles";


export default function LoginScreen() {
  const router = useRouter();
  const { registrationEmail } = useLocalSearchParams<{ registrationEmail?: string }>();
  const theme = useTheme();

  const { signIn } = useGoogleSignin();

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

  const usernameError =
    (submitted || usernameTouched) && !username.trim()
      ? "Enter your username."
      : undefined;
  const passwordError =
    (submitted || passwordTouched) && !password.trim()
      ? "Enter your password."
      : undefined;

  const handleCredentialSignIn = async () => {
    if (credentialPending.current) return;
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
      const identity = await loginAccount(username.trim(), password);
      const credential = await signInWithEmailAndPassword(auth, identity.email, password);
      signedInWithPassword = true;
      await credential.user.reload();
      if (!credential.user.emailVerified) {
        setVerificationEmail(identity.email);
        setCredentialError("Your email isn't verified yet. Please check your inbox to complete verification.");
        return;
      }
      const hasProfile = await ensureEmailPasswordProfile(credential.user);
      const destination = await postAuthDestination(credential.user, hasProfile);
      useAuthStore.getState().setUser(credential.user);
      useAuthStore.getState().setIsOldUser(hasProfile);
      router.replace(destination);
    } catch (error) {
      if (signedInWithPassword) await signOut(auth).catch(() => undefined);
      if (isUnverifiedAccount(error)) setVerificationEmail(username.includes("@") ? username.trim().toLowerCase() : "");
      setCredentialError(authErrorMessage(error, "login"));
    } finally {
      credentialPending.current = false;
      setIsCredentialLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);

      const user = await signIn();

      if (user) {
        const firebaseToken = await user.getIdToken();
        const isOldUser = await checkIsOldUser(firebaseToken);

        if (isOldUser) {
          router.replace("/(app)/(tabs)");
        } else {
          router.replace("/(onboarding)/register/profile");
        }
      }
    } catch (error) {
      setCredentialError(authErrorMessage(error, "login"));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const goBack = () => {
    Keyboard.dismiss();
    if (router.canGoBack()) router.back();
    else router.replace("/(public)/welcome");
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
          <View style={styles.brand}><MainLogo width={64} height={64} /></View>
          <View style={styles.introSection}>
            <ThemedText style={styles.title}>Log in</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>Enter your credentials or continue with Google.</ThemedText>
            {credentialError ? <View style={styles.feedback}><FormFeedback message={credentialError} /></View> : null}
            {verificationEmail !== null ? <Pressable onPress={() => router.push({ pathname: "/(public)/check-email", params: { email: verificationEmail } })} accessibilityRole="button" style={styles.verifyLink}>
              <ThemedText style={styles.forgotText}>Resend Verification Link</ThemedText>
            </Pressable> : null}
          </View>
          <View style={styles.formSection}>
            <View style={styles.fields}>
              <CustomTextInput
                label="Username or email"
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
                  <ThemedText style={styles.forgotText}>Forgot password?</ThemedText>
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
                  style={styles.legalLink}
                >
                  Terms of service
                </ThemedText>
                {"\n and "}
                <ThemedText
                  onPress={() => router.push("/privacy/privacy")}
                  style={styles.legalLink}
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
