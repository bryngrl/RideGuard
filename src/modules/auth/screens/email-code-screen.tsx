import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Keyboard, Text, View } from "react-native";
import { auth } from "@/lib/firebase";
import { useTheme } from "@/shared/hooks/use-theme";
import { Spacing, Typography } from "@/shared/theme";
import { AuthFormLayout } from "@/shared/ui/auth-form-layout";
import { Button } from "@/shared/ui/button";
import { FormFeedback } from "@/shared/ui/form-feedback";
import { CustomTextInput } from "@/shared/ui/text-input";
import { VerificationCodeInput } from "@/shared/ui/verification-code-input";
import { APIError } from "@/shared/api/errors";
import { useAuthStore } from "../store/auth.store";
import { useRegistrationDraft } from "../store/registration-draft.store";
import { verifyEmailCode, resendEmailVerificationCode, emailVerificationError, type VerifiedEmailIdentity } from "../services/email-verification.api";
import { completeEmailVerification } from "../services/complete-email-verification";
import { beginVerifiedSuccess } from "../services/verified-success";
import { authErrorMessage } from "../utils/auth-errors";

export default function EmailCodeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email || useRegistrationDraft.getState().email || auth.currentUser?.email || "").trim().toLowerCase();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState(() => useRegistrationDraft.getState().email.toLowerCase() === email ? useRegistrationDraft.getState().password : "");
  const [verified, setVerified] = useState<VerifiedEmailIdentity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const resendAt = useRegistrationDraft((state) => state.resendAt);
  const pending = useRef(false);
  const completed = useRef(false);
  const active = useRef(false);
  const version = useRef(0);
  const seconds = Math.max(0, Math.ceil((resendAt - now) / 1000));
  useFocusEffect(useCallback(() => {
    active.current = true; version.current++;
    if (!pending.current) { setBusy(false); setSending(false); }
    const back = BackHandler.addEventListener("hardwareBackPress", () => pending.current);
    return () => { active.current = false; version.current++; back.remove(); };
  }, [email]));
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    completed.current = false;
    setVerified(null); setCode(""); setError(null); setNotice(null); setAlreadyVerified(false);
    const draft = useRegistrationDraft.getState();
    setPassword(draft.email.toLowerCase() === email ? draft.password : "");
    if (/^[^\s@]+@gmail\.com$/i.test(email)) useRegistrationDraft.getState().update({ email, verificationEmail: email });
  }, [email]);
  const goBack = () => {
    if (pending.current) return;
    Keyboard.dismiss();
    router.dismissTo("/(public)/create-account");
  };

  const submit = async () => {
    if (pending.current || completed.current) return;
    if (!verified && !/^\d{6}$/.test(code)) { setError("Enter the six-digit code from your email."); return; }
    pending.current = true; setBusy(true); setError(null); setNotice(null); Keyboard.dismiss();
    const revision = version.current;
    const current = () => active.current && version.current === revision;
    let identity = verified;
    try {
      if (!identity) {
        identity = await verifyEmailCode(email, code);
        if (!current()) return;
        setVerified(identity); setCode("");
      }
      if (!password) { setNotice("Email verified. Enter your password to continue."); return; }
      const result = await completeEmailVerification(identity, password);
      if (!current() || auth.currentUser?.uid !== result.user.uid) return;
      completed.current = true;
      useAuthStore.getState().setIsOldUser(result.hasProfile);
      useAuthStore.getState().setUser(result.user);
      useRegistrationDraft.getState().clear(); setPassword("");
      beginVerifiedSuccess(result.user.uid, result.destination);
      if (router.canDismiss()) router.dismissAll();
      router.replace("/(public)/account-verified");
    } catch (failure) {
      if (!current()) return;
      if (!identity && failure instanceof APIError && failure.status === 409) setAlreadyVerified(true);
      setError(identity ? authErrorMessage(failure, "login") : emailVerificationError(failure));
    } finally {
      pending.current = false;
      if (active.current) setBusy(false);
    }
  };
  const resend = async () => {
    if (pending.current || completed.current || verified || Date.now() < useRegistrationDraft.getState().resendAt) return;
    pending.current = true; setSending(true); setError(null); setNotice(null);
    const revision = version.current;
    try {
      await resendEmailVerificationCode(email);
      useRegistrationDraft.getState().update({ resendAt: Date.now() + 60_000, deliveryFailed: false });
      if (active.current && version.current === revision) { setCode(""); setNotice("If this account is awaiting verification, a new code has been sent."); }
    } catch (failure) {
      if (failure instanceof APIError && failure.status === 429) useRegistrationDraft.getState().update({ resendAt: Date.now() + 60_000 });
      if (active.current && version.current === revision) {
        if (failure instanceof APIError && failure.status === 409) setAlreadyVerified(true);
        setError(emailVerificationError(failure));
      }
    } finally {
      pending.current = false;
      if (active.current) { setSending(false); setNow(Date.now()); }
    }
  };
  return <AuthFormLayout title="Verify your email" onBack={goBack} backDisabled={busy || sending}
    description={<>Enter the six-digit code sent to{"\n"}<Text style={{ color: theme.accent }}>{email}</Text></>}>
    <View style={{ gap: Spacing.three }}>
      {!verified && <VerificationCodeInput value={code} onChange={(value) => { setCode(value); setError(null); }} disabled={busy || sending} error={!!error} />}
      {verified && <CustomTextInput label="Password" required isPassword value={password} onChangeText={setPassword}
        autoComplete="current-password" textContentType="password" editable={!busy} onSubmitEditing={submit} />}
      {notice && <FormFeedback tone="info" message={notice} />}
      {error && <FormFeedback message={error} />}
      {alreadyVerified ? <Button title="Go to login" onPress={() => {
        useRegistrationDraft.getState().clear();
        router.replace({ pathname: "/(public)/sign-in", params: { registrationEmail: email } });
      }} /> :
        <Button title={verified ? "Continue" : "Verify email"} onPress={submit} isLoading={busy} disabled={sending || !email} />}
      {!verified && !alreadyVerified && <Button title={seconds ? `Resend code in ${seconds}s` : "Resend code"}
        variant="ghost" onPress={resend} isLoading={sending} disabled={busy || seconds > 0 || !email} />}
      <Text style={[Typography.bodySmall, { color: theme.textMuted, textAlign: "center" }]}>Check your spam folder if you cannot find the code.</Text>
    </View>
  </AuthFormLayout>;
}
