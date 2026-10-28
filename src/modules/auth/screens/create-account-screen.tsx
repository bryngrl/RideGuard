import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import MainLogo from "@/assets/icons/logos/main.svg";
import { BackArrowIcon } from "@/shared/ui/back-arrow-icon";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { FormFeedback } from "@/shared/ui/form-feedback";
import { CustomTextInput } from "@/shared/ui/text-input";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { KeyboardAwareFormScrollView } from "@/shared/ui/keyboard-aware-form-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "@/lib/firebase";

import { styles } from "./create-account-screen.styles";
import { registerAccount } from "../services/auth.api";
import { markRegistrationOnboardingPending } from "../services/registration-progress";
import { useRegistrationDraft } from "../store/registration-draft.store";
import { sendVerificationForUser } from "../services/verification-email";
import { authErrorMessage, registrationFieldErrors } from "../utils/auth-errors";
import { getConfirmPasswordError, getPasswordError } from "../utils/password-validation";

type Field = "username" | "email" | "password" | "confirmPassword";
type TouchedFields = Partial<Record<Field, boolean>>;

const emailPattern = /^[^\s@]+@gmail\.com$/i;

export default function CreateAccountScreen() {
  const router = useRouter();
  const theme = useTheme();
  const emailRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const { username, email, password, confirmPassword, created, update } = useRegistrationDraft();
  const setUsername = (username: string) => update({ username });
  const setEmail = (email: string) => update({ email });
  const setPassword = (password: string) => update({ password });
  const setConfirmPassword = (confirmPassword: string) => update({ confirmPassword });
  const [touched, setTouched] = useState<TouchedFields>({});
  const [submitted, setSubmitted] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Partial<Record<Field, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const submitting = useRef(false);

  const usernameError = !username.trim()
    ? "Enter a username."
    : !/^[A-Za-z0-9._]{3,24}$/.test(username.trim())
      ? "Use 3–24 letters, numbers, periods, or underscores."
      : undefined;
  const emailError = !email.trim()
    ? "Enter your email address."
    : !emailPattern.test(email.trim())
      ? "Use a Gmail address."
      : undefined;
  const passwordError = getPasswordError(password);
  const confirmError = getConfirmPasswordError(password, confirmPassword);

  const markTouched = (field: Field) =>
    setTouched((current) => ({ ...current, [field]: true }));

  const handleSubmit = async () => {
    if (submitting.current) return;
    setSubmitted(true);
    setFormMessage(null);
    setServerErrors({});
    if (usernameError || emailError || passwordError || confirmError) {
      (usernameError ? usernameRef : emailError ? emailRef : passwordError ? passwordRef : confirmRef).current?.focus();
      return;
    }

    Keyboard.dismiss();
    submitting.current = true;
    setIsLoading(true);
    try {
      const registrationEmail = email.trim().toLowerCase();
      const registrationUsername = username.trim().toLowerCase();
      if (created && (created.email !== registrationEmail || created.username.toLowerCase() !== registrationUsername)) {
        setFormMessage("Account already created. Restore the original username and email.");
        return;
      }
      if (!created) {
        await registerAccount({ username: registrationUsername, email: registrationEmail, password });
        update({ created: { username: registrationUsername, email: registrationEmail } });
        await markRegistrationOnboardingPending(registrationEmail);
      }
      // The current backend creates the Firebase user but does not send the link.
      // Retain its authenticated session for verification polling and resend.
      try {
        const { user } = await signInWithEmailAndPassword(auth, registrationEmail, password);
        if (!created && !user.emailVerified) {
          try {
            await sendVerificationForUser(user);
            update({ resendAt: Date.now() + 60_000 });
          } catch {
            // Account creation succeeded. Keep verification accessible so the
            // existing resend action can recover delivery without another create.
            update({ deliveryFailed: true });
          }
        }
      } catch {
        setFormMessage("Account created. Check your password and retry verification.");
        return;
      }
      router.push({ pathname: "/(public)/check-email", params: { email: registrationEmail } });
    } catch (error) {
      const fields = registrationFieldErrors(error);
      setServerErrors(fields);
      setFormMessage(Object.keys(fields).length ? null : authErrorMessage(error, "register"));
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  };

  const goBack = () => {
    Keyboard.dismiss();
    if (router.canGoBack()) router.back();
    else router.replace("/(public)/welcome");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <KeyboardAwareFormScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} keyboardGap={Spacing.four}>
      <Pressable onPress={goBack} style={styles.backButton} feedbackRadius={16} feedbackInsets={Spacing.two} feedbackBehindContent accessibilityRole="button" accessibilityLabel="Back to welcome">
        <BackArrowIcon color={theme.text} />
      </Pressable>
      <View style={styles.brand}><MainLogo color={theme.logo} width={64} height={64} /></View>

      <Text style={[styles.heading, { color: theme.text }]}>Create account</Text>
      <Text style={[styles.description, { color: theme.textMuted }]}>Enter your details to create an account.</Text>
      {formMessage ? <View style={styles.feedback}><FormFeedback message={formMessage} /></View> : null}

      <View style={styles.fields}>
        <CustomTextInput
          ref={usernameRef}
          label="Username"
          required
          value={username}
          onChangeText={(value) => {
            setUsername(value);
            setFormMessage(null);
            setServerErrors((current) => ({ ...current, username: undefined }));
          }}
          onBlur={() => markTouched("username")}
          error={serverErrors.username || (submitted || touched.username ? usernameError : undefined)}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          containerStyle={styles.field}
          inputWrapperStyle={styles.inputWrapper}
        />
        <CustomTextInput
          ref={emailRef}
          label="Email address"
          required
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setFormMessage(null);
            setServerErrors((current) => ({ ...current, email: undefined }));
          }}
          onBlur={() => markTouched("email")}
          error={serverErrors.email || (submitted || touched.email ? emailError : undefined)}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          containerStyle={styles.field}
          inputWrapperStyle={styles.inputWrapper}
        />
        <CustomTextInput
          ref={passwordRef}
          label="Password"
          required
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setFormMessage(null);
            setServerErrors((current) => ({ ...current, password: undefined }));
          }}
          onBlur={() => markTouched("password")}
          error={serverErrors.password || (submitted || touched.password ? passwordError : undefined)}
          isPassword
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          containerStyle={styles.field}
          inputWrapperStyle={styles.inputWrapper}
        />
        <CustomTextInput
          ref={confirmRef}
          label="Confirm password"
          required
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            setFormMessage(null);
          }}
          onBlur={() => markTouched("confirmPassword")}
          error={submitted || touched.confirmPassword ? confirmError : undefined}
          isPassword
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          containerStyle={styles.field}
          inputWrapperStyle={styles.inputWrapper}
        />
      </View>

      <Button title={created ? "Continue verification" : "Create account"} onPress={handleSubmit} isLoading={isLoading} disabled={isLoading} style={styles.submitButton} />

      <Pressable
        onPress={() => router.replace("/(public)/sign-in")}
        style={styles.loginLink}
        accessibilityRole="button"
      >
        <Text style={[styles.loginText, { color: theme.text }]}>Already have an account? </Text>
        <Text style={[styles.loginAction, { color: theme.accent }]}>Log in</Text>
      </Pressable>
        </KeyboardAwareFormScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
