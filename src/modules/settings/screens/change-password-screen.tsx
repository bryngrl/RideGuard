import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { BackHandler, Keyboard, Text, TextInput, View } from "react-native";
import { auth } from "@/lib/firebase";
import { SettingsPageLayout } from "../components/settings-page-layout";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { Button } from "@/shared/ui/button";
import { CustomTextInput } from "@/shared/ui/text-input";
import { FormFeedback } from "@/shared/ui/form-feedback";
import { getConfirmPasswordError, getPasswordError, PASSWORD_REQUIREMENTS } from "@/modules/auth/utils/password-validation";
import { endCredentialChangeSession } from "@/modules/auth/services/credential-change-session";
import { usePasswordChangeResult } from "@/modules/auth/store/password-change-result.store";
import { accountSecurityError, changeAccountPassword } from "../services/account-security.api";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef(false);
  const pending = useRef(false);
  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const hasPassword = auth.currentUser?.providerData.some((provider) => provider.providerId === "password") === true;
  const goBack = () => { if (!pending.current) router.canGoBack() ? router.back() : router.replace("/(app)/(tabs)/settings"); };
  useFocusEffect(useCallback(() => {
    active.current = true;
    const back = BackHandler.addEventListener("hardwareBackPress", () => pending.current);
    return () => { active.current = false; back.remove(); setCurrentPassword(""); setNewPassword(""); setConfirmation(""); };
  }, []));

  const submit = async () => {
    if (pending.current) return;
    setSubmitted(true); setError(null);
    if (!changed && (!currentPassword || getPasswordError(newPassword) || getConfirmPasswordError(newPassword, confirmation) || currentPassword === newPassword)) return;
    const user = auth.currentUser;
    if (!user || !hasPassword) { setError("Log in with your password account to continue."); return; }
    pending.current = true; setBusy(true); Keyboard.dismiss();
    let confirmed = changed;
    try {
      const token = await user.getIdToken();
      if (!active.current || auth.currentUser?.uid !== user.uid) return;
      if (!confirmed) {
        await changeAccountPassword(token, currentPassword, newPassword);
        confirmed = true;
        if (active.current) { setChanged(true); setCurrentPassword(""); setNewPassword(""); setConfirmation(""); }
      }
      // Do not repeat the password mutation if local sign-out needs a retry.
      if (auth.currentUser?.uid !== user.uid) return;
      usePasswordChangeResult.getState().confirm();
      router.replace("/(public)/password-changed");
      await endCredentialChangeSession(user.uid, token);
    } catch (failure) {
      if (active.current) setError(confirmed ? "Password changed. Please log out and sign in again with your new password." : accountSecurityError(failure));
    } finally { pending.current = false; if (active.current) setBusy(false); }
  };
  return <SettingsPageLayout title="Change password" onBack={goBack}>
    <Stack.Screen options={{ gestureEnabled: !busy }} />
    <View style={{ gap: Spacing.three }}>
      {!hasPassword ? <FormFeedback tone="info" message="This account signs in with Google. Manage your Google password through your Google account." /> : <>
        <Text style={[Typography.body, { color: theme.textMuted }]}>After changing your password, sign in again with your new password.</Text>
        {!changed && <>
          <CustomTextInput label="Current password" required isPassword value={currentPassword} onChangeText={setCurrentPassword} editable={!busy}
            autoComplete="current-password" textContentType="password" returnKeyType="next" onSubmitEditing={() => newRef.current?.focus()}
            error={submitted && !currentPassword ? "Enter your current password." : undefined} />
          <CustomTextInput ref={newRef} label="New password" required isPassword value={newPassword} onChangeText={setNewPassword} editable={!busy}
            autoComplete="new-password" textContentType="newPassword" hint={PASSWORD_REQUIREMENTS} returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()}
            error={submitted ? getPasswordError(newPassword) || (newPassword === currentPassword ? "Choose a different password." : undefined) : undefined} />
          <CustomTextInput ref={confirmRef} label="Confirm new password" required isPassword value={confirmation} onChangeText={setConfirmation} editable={!busy}
            autoComplete="new-password" textContentType="newPassword" returnKeyType="done" onSubmitEditing={submit}
            error={submitted ? getConfirmPasswordError(newPassword, confirmation) : undefined} />
        </>}
        {error && <FormFeedback message={error} />}
        <Button title={changed ? "Finish signing out" : "Change password"} onPress={submit} isLoading={busy} />
      </>}
    </View>
  </SettingsPageLayout>;
}
