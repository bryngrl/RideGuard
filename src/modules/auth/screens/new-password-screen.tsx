import { Stack, useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, BackHandler, Keyboard, StyleSheet, TextInput, View } from "react-native";

import { Spacing } from "@/shared/theme";
import { AuthFormLayout } from "@/shared/ui/auth-form-layout";
import { Button } from "@/shared/ui/button";
import { FormFeedback } from "@/shared/ui/form-feedback";
import { CustomTextInput } from "@/shared/ui/text-input";

import { changeResetPassword, RecoveryError, recoveryMessage } from "../services/password-recovery";
import { isResetSessionValid, usePasswordRecoveryStore } from "../store/password-recovery.store";
import { getConfirmPasswordError, getPasswordError, PASSWORD_REQUIREMENTS } from "../utils/password-validation";

export default function NewPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ preview?: string }>();
  const preview = __DEV__ && params.preview === "1";
  const navigation = useNavigation("/");
  const session = usePasswordRecoveryStore((state) => state.session);
  const confirmRef = useRef<TextInput>(null);
  const pending = useRef(false);
  const active = useRef(true);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [touched, setTouched] = useState({ password: false, confirmation: false });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const validSession = isResetSessionValid(session, now);
  const canEdit = preview || validSession;
  const passwordError = getPasswordError(password);
  const confirmationError = getConfirmPasswordError(password, confirmation);

  useFocusEffect(useCallback(() => {
    active.current = true;
    if (!pending.current) setLoading(false);
    return () => {
      active.current = false;
      setPassword("");
      setConfirmation("");
      setTouched({ password: false, confirmation: false });
    };
  }, []));

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    const subscription = AppState.addEventListener("change", () => setNow(Date.now()));
    return () => { clearInterval(interval); subscription.remove(); };
  }, []);

  useEffect(() => {
    if (preview || validSession || loading) return;
    setPassword("");
    setConfirmation("");
    // Drop expired credentials immediately, retaining a clear recovery action.
    if (session) usePasswordRecoveryStore.getState().clear();
  }, [preview, validSession, loading, session]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => pending.current);
    return () => subscription.remove();
  }, []));

  const handleBack = () => {
    if (pending.current) return;
    Keyboard.dismiss();
    if (router.canGoBack()) router.back();
    else router.replace("/(public)/forgot-password");
  };

  const restartRecovery = () => {
    if (pending.current) return;
    Keyboard.dismiss();
    setPassword("");
    setConfirmation("");
    usePasswordRecoveryStore.getState().clear();
    router.dismissTo("/(public)/forgot-password");
  };

  const handleSubmit = async () => {
    if (pending.current) return;
    setSubmitted(true);
    setRequestError(null);
    if (preview) {
      if (passwordError || confirmationError) return;
      Keyboard.dismiss();
      setRequestError("Preview only. Your password has not been changed; the backend is not connected yet.");
      return;
    }
    if (!isResetSessionValid(session)) {
      setNow(Date.now());
      return;
    }
    if (passwordError || confirmationError) return;
    Keyboard.dismiss();
    pending.current = true;
    setLoading(true);
    try {
      const result = await changeResetPassword(session.resetToken, password);
      if (result?.success !== true) {
        throw new RecoveryError("request-failed", "Your password could not be changed. Please try again.");
      }
      if (!active.current || !usePasswordRecoveryStore.getState().complete(session.resetToken)) return;
      setPassword("");
      setConfirmation("");
      // Remove all recovery routes so back navigation cannot reveal sensitive forms.
      navigation.dispatch({
        type: "RESET",
        payload: {
          index: 1,
          routes: [{ name: "(public)/welcome" }, { name: "(public)/password-reset-success" }],
        },
      });
    } catch (reason) {
      if (!active.current) return;
      if (reason instanceof RecoveryError && (reason.code === "invalid-session" || reason.code === "expired-session")) {
        usePasswordRecoveryStore.getState().clear();
      }
      setRequestError(recoveryMessage(reason));
    } finally {
      pending.current = false;
      if (active.current) setLoading(false);
    }
  };

  return (
    <AuthFormLayout title="Create new password"
      variant="recovery"
      description="Enter and confirm your new password to secure your account."
      onBack={handleBack} backDisabled={loading}>
      <Stack.Screen options={{ gestureEnabled: !loading }} />
      <View style={styles.form}>
        {preview && <FormFeedback tone="info" message="Development preview. Test the fields and validation here; no password will be changed." />}
        {!canEdit && !loading && (
          <FormFeedback message="Your reset session has expired or is invalid. Request a new code to continue." />
        )}
        <CustomTextInput label="New password" required isPassword
          value={password} onChangeText={(value) => { setPassword(value); setRequestError(null); }}
          onBlur={() => setTouched((value) => ({ ...value, password: true }))}
          error={canEdit && (touched.password || submitted) ? passwordError : undefined}
          hint={PASSWORD_REQUIREMENTS} editable={canEdit && !loading}
          autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword"
          returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()}
          containerStyle={styles.field} inputWrapperStyle={styles.inputWrapper} />
        <CustomTextInput ref={confirmRef} label="Confirm new password" required isPassword
          value={confirmation} onChangeText={(value) => { setConfirmation(value); setRequestError(null); }}
          onBlur={() => setTouched((value) => ({ ...value, confirmation: true }))}
          error={canEdit && (touched.confirmation || submitted) ? confirmationError : undefined}
          editable={canEdit && !loading} autoCapitalize="none" autoCorrect={false}
          autoComplete="new-password" textContentType="newPassword" returnKeyType="done" onSubmitEditing={handleSubmit}
          containerStyle={styles.field} inputWrapperStyle={styles.inputWrapper} />
        {canEdit && requestError && <FormFeedback message={requestError} tone={preview ? "info" : "error"} />}
        <Button title="Change Password" onPress={handleSubmit} isLoading={loading}
          disabled={!canEdit || !!passwordError || !!confirmationError} style={styles.submitButton} />
        {!canEdit && !loading && <Button title="Request a new code" variant="ghost" onPress={restartRecovery} />}
      </View>
    </AuthFormLayout>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: Spacing.five, gap: Spacing.three },
  field: { marginBottom: 0 },
  inputWrapper: { minHeight: 44 },
  submitButton: { height: 41, marginTop: Spacing.two },
});
