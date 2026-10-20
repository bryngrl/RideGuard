import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MainLogo from "@/assets/icons/logos/main.svg";
import { ThemedText } from "@/components/themed-text";

import { useGoogleSignin } from "../hooks/use-google-signin";

import { useTheme } from "@/shared/hooks/use-theme";
import { Button } from "@/shared/ui/button";
import { BackArrowIcon } from "@/shared/ui/back-arrow-icon";
import { GoogleButton } from "@/shared/ui/google-button";
import { CustomTextInput } from "@/shared/ui/text-input";

import { checkIsOldUser } from "../services/auth.api";
import { useAuthStore } from "../store/auth.store";

import { styles } from "./login-screen.styles";

const DEMO_USERNAME = "rideguard.demo";
const DEMO_PASSWORD = "RideGuard123!";

type DemoFieldErrors = {
  username?: string;
  password?: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { signIn } = useGoogleSignin();
  const startDemo = useAuthStore((state) => state.startDemo);

  const passwordRef = useRef<TextInput>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [demoErrors, setDemoErrors] = useState<DemoFieldErrors>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const usernameError =
    (submitted || usernameTouched) && !username.trim()
      ? "Enter your username."
      : demoErrors.username;
  const passwordError =
    (submitted || passwordTouched) && !password.trim()
      ? "Enter your password."
      : demoErrors.password;

  const handleCredentialSignIn = () => {
    setSubmitted(true);

    if (!username.trim() || !password.trim()) {
      setDemoErrors({});
      return;
    }

    const nextErrors: DemoFieldErrors = {
      username:
        username.trim() === DEMO_USERNAME
          ? undefined
          : "Username not found.",
      password:
        password === DEMO_PASSWORD
          ? undefined
          : "Incorrect password.",
    };
    setDemoErrors(nextErrors);

    if (nextErrors.username || nextErrors.password) return;

    Keyboard.dismiss();
    startDemo();
    router.replace("/(app)/(tabs)");
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
      console.error("Google Sign-In failed:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Google Sign-In failed.",
      );
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={goBack} style={styles.backButton} feedbackRadius={16} feedbackInsets={{ top: 8, right: 6, bottom: 8, left: 6 }} feedbackBehindContent accessibilityRole="button" accessibilityLabel="Back to welcome">
            <BackArrowIcon color={theme.text} />
          </Pressable>
          <View style={styles.brand}><MainLogo width={64} height={64} /></View>
          <View style={styles.introSection}>
            <ThemedText style={styles.title}>Log in</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>Enter your credentials or continue with Google.</ThemedText>
          </View>
          <View style={styles.formSection}>
            <View style={styles.fields}>
              <CustomTextInput
                label="Username"
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  setDemoErrors((errors) => ({ ...errors, username: undefined }));
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
                  setDemoErrors((errors) => ({ ...errors, password: undefined }));
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
              <Pressable
                onPress={() => router.push("/(public)/forgot-password")}
                style={styles.forgotButton}
                accessibilityRole="button"
              >
                <ThemedText style={styles.forgotText}>Forgot password?</ThemedText>
              </Pressable>
            </View>

            <Button
              title="Log in"
              onPress={handleCredentialSignIn}
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
              disabled={isGoogleLoading}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
