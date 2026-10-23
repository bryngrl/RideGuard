import { auth } from "@/lib/firebase";
import { Spacing } from "@/shared/theme";
import { AuthFormLayout } from "@/shared/ui/auth-form-layout";
import { Button } from "@/shared/ui/button";
import { FormFeedback } from "@/shared/ui/form-feedback";
import { CustomTextInput } from "@/shared/ui/text-input";
import { useLocalSearchParams, useRouter } from "expo-router";
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";

import { getConfirmPasswordError, getPasswordError, PASSWORD_REQUIREMENTS } from "@/modules/auth/utils/password-validation";

/** Accepts Firebase action links when the email transport targets this app route. */
export default function AuthActionScreen() {
  const router = useRouter();
  const { mode, oobCode } = useLocalSearchParams<{ mode?: string; oobCode?: string }>();
  const [state, setState] = useState<"checking" | "ready" | "complete" | "error">("checking");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    let active = true;
    if (!oobCode || (mode !== "verifyEmail" && mode !== "resetPassword")) {
      setMessage("This email link is invalid. Request a new link and try again.");
      setState("error");
      return;
    }
    setState("checking");
    const apply = async () => {
      try {
        if (mode === "verifyEmail") {
          await applyActionCode(auth, oobCode);
          if (auth.currentUser) await auth.currentUser.reload();
          if (active) {
            setMessage("Email verified. Log in to finish creating your RideGuard profile.");
            setState("complete");
          }
        } else {
          await verifyPasswordResetCode(auth, oobCode);
          if (active) setState("ready");
        }
      } catch {
        if (active) {
          setMessage("This link has expired or has already been used. Request a new link.");
          setState("error");
        }
      }
    };
    void apply();
    return () => { active = false; };
  }, [mode, oobCode]);

  const passwordError = getPasswordError(password);
  const confirmationError = getConfirmPasswordError(password, confirmation);
  const reset = async () => {
    if (pending.current || !oobCode || state !== "ready") return;
    setSubmitted(true);
    if (passwordError || confirmationError) return;
    pending.current = true;
    setSaving(true);
    Keyboard.dismiss();
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setPassword("");
      setConfirmation("");
      setMessage("Password changed. You can now log in with your new password.");
      setState("complete");
    } catch {
      setMessage("Your reset link expired or could not be used. Request a new link.");
      setState("error");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };

  return (
    <AuthFormLayout
      variant="recovery"
      title={mode === "verifyEmail" ? "Verify email" : "Reset password"}
      description={state === "checking" ? "Checking your email link…" : "Complete the action from your RideGuard email."}
      onBack={() => router.replace("/(public)/sign-in")}
      backDisabled={saving}
    >
      <View style={styles.form}>
        {state === "ready" ? (
          <>
            <CustomTextInput label="New password" required isPassword value={password} onChangeText={setPassword}
              error={submitted ? passwordError : undefined} hint={PASSWORD_REQUIREMENTS}
              autoComplete="new-password" textContentType="newPassword" />
            <CustomTextInput label="Confirm new password" required isPassword value={confirmation} onChangeText={setConfirmation}
              error={submitted ? confirmationError : undefined} autoComplete="new-password" textContentType="newPassword" />
            <Button title="Change password" onPress={reset} isLoading={saving} />
          </>
        ) : null}
        {state === "complete" || state === "error" ? <FormFeedback tone={state === "complete" ? "info" : "error"} message={message} /> : null}
        {state === "complete" ? <Button title="Go to login" onPress={() => router.replace("/(public)/sign-in")} /> : null}
        {state === "error" ? <Button title={mode === "verifyEmail" ? "Go to login" : "Request a new link"}
          onPress={() => router.replace(mode === "verifyEmail" ? "/(public)/sign-in" : "/(public)/forgot-password")} /> : null}
      </View>
    </AuthFormLayout>
  );
}

const styles = StyleSheet.create({ form: { gap: Spacing.three, marginTop: Spacing.five } });
