import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import MainLogo from "@/assets/icons/logos/main.svg";
import { BackArrowIcon } from "@/shared/ui/back-arrow-icon";
import { useTheme } from "@/shared/hooks/use-theme";
import { Button } from "@/shared/ui/button";
import { CustomTextInput } from "@/shared/ui/text-input";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "./create-account-screen.styles";
import { getConfirmPasswordError, getPasswordError } from "../utils/password-validation";

type Field = "username" | "email" | "password" | "confirmPassword";
type TouchedFields = Partial<Record<Field, boolean>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateAccountScreen() {
  const router = useRouter();
  const theme = useTheme();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState<TouchedFields>({});
  const [submitted, setSubmitted] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const usernameError = !username.trim()
    ? "Enter a username."
    : !/^[A-Za-z0-9._]{3,24}$/.test(username.trim())
      ? "Use 3–24 letters, numbers, periods, or underscores."
      : undefined;
  const emailError = !email.trim()
    ? "Enter your email address."
    : !emailPattern.test(email.trim())
      ? "Enter a valid email address."
      : undefined;
  const passwordError = getPasswordError(password);
  const confirmError = getConfirmPasswordError(password, confirmPassword);

  const markTouched = (field: Field) =>
    setTouched((current) => ({ ...current, [field]: true }));

  const handleSubmit = () => {
    setSubmitted(true);
    setFormMessage(null);
    if (usernameError || emailError || passwordError || confirmError) return;

    Keyboard.dismiss();
    setFormMessage(
      "Account creation is not connected yet. No account was created. You can use the demo login to explore the app.",
    );
  };

  const goBack = () => {
    Keyboard.dismiss();
    if (router.canGoBack()) router.back();
    else router.replace("/(public)/welcome");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Pressable onPress={goBack} style={styles.backButton} feedbackRadius={16} feedbackInsets={{ top: 8, right: 6, bottom: 8, left: 6 }} feedbackBehindContent accessibilityRole="button" accessibilityLabel="Back to welcome">
        <BackArrowIcon color={theme.text} />
      </Pressable>
      <View style={styles.brand}><MainLogo width={64} height={64} /></View>

      <Text style={[styles.heading, { color: theme.text }]}>Create account</Text>
      <Text style={[styles.description, { color: theme.textMuted }]}>
        Enter your details to create an account.
      </Text>

      <View style={styles.fields}>
        <CustomTextInput
          label="Username"
          required
          value={username}
          onChangeText={(value) => {
            setUsername(value);
            setFormMessage(null);
          }}
          onBlur={() => markTouched("username")}
          error={submitted || touched.username ? usernameError : undefined}
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
          }}
          onBlur={() => markTouched("email")}
          error={submitted || touched.email ? emailError : undefined}
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
          }}
          onBlur={() => markTouched("password")}
          error={submitted || touched.password ? passwordError : undefined}
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

      <Button title="Create account" onPress={handleSubmit} style={styles.submitButton} />
      {formMessage && (
        <View style={[styles.messageBox, { backgroundColor: theme.infoBackground }]}>
          <Text accessibilityRole="alert" style={[styles.messageText, { color: theme.text }]}>
            {formMessage}
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => router.replace("/(public)/sign-in")}
        style={styles.loginLink}
        accessibilityRole="button"
      >
        <Text style={[styles.loginText, { color: theme.text }]}>Already have an account? </Text>
        <Text style={[styles.loginAction, { color: theme.accent }]}>Log in</Text>
      </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
