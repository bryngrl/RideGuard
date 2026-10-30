import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { AppState, BackHandler, Linking, Text } from "react-native";

import { auth } from "@/lib/firebase";
import { useTheme } from "@/shared/hooks/use-theme";
import { AuthFormLayout } from "@/shared/ui/auth-form-layout";
import { EmailLinkContent } from "@/shared/ui/email-link-content";
import { NotificationSheet } from "@/shared/ui/notification-sheet";
import { ensureEmailPasswordProfile, getCurrentUser } from "../services/auth.api";
import { postAuthDestination } from "../services/registration-progress";
import { sendVerificationForUser, verificationEmailMessage } from "../services/verification-email";
import { useAuthStore } from "../store/auth.store";
import { useRegistrationDraft } from "../store/registration-draft.store";
import { beginVerifiedSuccess } from "../services/verified-success";

export default function CheckEmailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { email: routeEmail } = useLocalSearchParams<{ email?: string }>();
  const email = (routeEmail || auth.currentUser?.email || "").trim().toLowerCase();
  const resendAt = useRegistrationDraft((state) => state.resendAt);
  const [now, setNow] = useState(Date.now());
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(() =>
    useRegistrationDraft.getState().deliveryFailed ? { message: "Couldn't send verification link. Try resending.", type: "error" } : null);
  const [statusError, setStatusError] = useState(false);
  const pending = useRef(false);
  const completed = useRef(false);
  const active = useRef(false);
  const focusVersion = useRef(0);
  const seconds = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const hideNotice = useCallback(() => setNotice(null), []);

  const goBack = useCallback(() => {
    active.current = false;
    router.dismissTo("/(public)/create-account");
  }, [router]);

  const checkStatus = useCallback(async () => {
    if (!active.current || pending.current || completed.current || AppState.currentState !== "active") return;
    const user = auth.currentUser;
    if (!user || user.email?.toLowerCase() !== email) {
      setStatusError(true);
      return;
    }
    pending.current = true;
    const version = focusVersion.current;
    const stillCurrent = () => active.current && version === focusVersion.current &&
      AppState.currentState === "active" && auth.currentUser?.uid === user.uid;
    try {
      await user.reload();
      if (!stillCurrent()) return;
      setStatusError(false);
      if (!user.emailVerified) return;
      // A link event only triggers this check. The server must confirm the session.
      const identity = await getCurrentUser(await user.getIdToken(true));
      if (!stillCurrent() || identity.emailVerified !== true || identity.uid !== user.uid) return;
      const hasProfile = await ensureEmailPasswordProfile(user);
      const destination = await postAuthDestination(user, hasProfile);
      if (!stillCurrent() || completed.current) return;
      completed.current = true;
      useRegistrationDraft.getState().clear();
      useAuthStore.getState().setIsOldUser(hasProfile);
      useAuthStore.getState().setUser(user);
      if (!hasProfile) {
        beginVerifiedSuccess(user.uid, destination);
        if (router.canDismiss()) router.dismissAll();
        router.replace("/(public)/account-verified");
      } else router.replace(destination);
    } catch {
      if (stillCurrent()) setStatusError(true);
    } finally {
      pending.current = false;
    }
  }, [email, router]);

  useFocusEffect(useCallback(() => {
    active.current = true;
    focusVersion.current++;
    void checkStatus();
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") void checkStatus();
    });
    // Never trust URL parameters as verification proof or accept custom tokens.
    const link = Linking.addEventListener("url", () => void checkStatus());
    const back = BackHandler.addEventListener("hardwareBackPress", () => { goBack(); return true; });
    const poll = setInterval(() => { if (!completed.current) void checkStatus(); }, 12_000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active.current = false;
      focusVersion.current++;
      appState.remove(); link.remove(); back.remove(); clearInterval(poll); clearInterval(clock);
    };
  }, [checkStatus, goBack]));

  const resend = async () => {
    if (pending.current || completed.current || Date.now() < useRegistrationDraft.getState().resendAt) return;
    const user = auth.currentUser;
    if (!user || user.email?.toLowerCase() !== email) {
      setNotice({ message: "Go back to restore verification.", type: "error" });
      return;
    }
    pending.current = true;
    setSending(true);
    try {
      await user.reload();
      if (!user.emailVerified) {
        await sendVerificationForUser(user);
        useRegistrationDraft.getState().update({ resendAt: Date.now() + 60_000, deliveryFailed: false });
        if (active.current) setNotice({ message: "Verification email sent successfully.", type: "success" });
      }
    } catch (error) {
      // Firebase does not expose a Retry-After deadline; enforce a local minimum.
      useRegistrationDraft.getState().update({ resendAt: Date.now() + 60_000 });
      if (active.current) setNotice({ message: verificationEmailMessage(error), type: "error" });
    } finally {
      pending.current = false;
      if (active.current) { setSending(false); setNow(Date.now()); void checkStatus(); }
    }
  };

  return <AuthFormLayout title="Check your email" onBack={goBack}
    description={<>We've sent a verification link to{"\n"}<Text style={{ color: theme.accent }}>{email}</Text></>}
    notification={<NotificationSheet visible={!!notice} message={notice?.message ?? ""} type={notice?.type} onHide={hideNotice} />}>
    <EmailLinkContent instruction="Tap the link in your email to verify your account."
      status={statusError ? "Couldn't check verification. Retrying..." : "We'll continue automatically after you verify your email."}
      onResend={resend} seconds={seconds} sending={sending} />
  </AuthFormLayout>;
}
