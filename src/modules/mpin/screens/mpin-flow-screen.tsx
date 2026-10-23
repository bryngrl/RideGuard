import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, BackHandler, Keyboard, Text, View } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useLogout } from "@/modules/settings/hooks/use-logout";
import { useTheme } from "@/shared/hooks/use-theme";
import { Button } from "@/shared/ui/button";
import { PinPad } from "@/shared/ui/pin-pad";
import { VerificationCodeInput } from "@/shared/ui/verification-code-input";

import { MpinLayout, mpinStyles as styles } from "../components/mpin-layout";
import { MpinUnlockExperience } from "../components/mpin-unlock-experience";
import { useMpinRequest } from "../hooks/use-mpin-request";
import { MpinError, mpinApi, type MpinMode, type MpinStatus } from "../services/mpin.api";
import { useMpinStore } from "../store/mpin.store";
import { isCompleteMpin, validAuthorization } from "../utils/mpin-policy";

const stepCopy: Record<string, { title: string; description: string }> = {
  intro: { title: "Secure your RideGuard account", description: "Create a 4-digit MPIN for quick and secure access to your account." },
  create: { title: "Create your MPIN", description: "Choose a 4-digit PIN to secure your account." },
  confirm: { title: "Confirm your MPIN", description: "Re-enter your 4-digit MPIN to confirm." },
  unlock: { title: "Enter your MPIN", description: "Enter your 4-digit PIN to continue." },
  current: { title: "Enter current MPIN", description: "Verify your current MPIN. We'll then send a confirmation code to your registered email." },
  forgot: { title: "Forgot your MPIN?", description: "Verify your identity using your registered email address to reset your MPIN." },
  "verify-identity": { title: "Verify your email", description: "Enter the 6-digit code sent to your registered email." },
  status: { title: "Checking your MPIN", description: "We'll check whether your account needs MPIN setup or unlocking." },
  manage: { title: "MPIN security", description: "Manage the MPIN used to access your RideGuard account." },
};

export default function MpinFlowScreen() {
  const params = useLocalSearchParams<{ step?: string; mode?: string }>();
  const mode: MpinMode = params.mode === "change" || params.mode === "reset" ? params.mode : "setup";
  const step = typeof params.step === "string" ? params.step : "status";
  const preview = false;
  // Remount local fields when a route's step changes, rather than retaining PINs.
  return <MpinStep key={`${step}/${mode}/${preview}`} step={step} mode={mode} preview={preview} />;
}

function MpinStep({ step, mode, preview }: { step: string; mode: MpinMode; preview: boolean }) {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation("/");
  const logout = useLogout();
  const user = useAuthStore((state) => state.user);
  const state = useMpinStore();
  const [pin, setPin] = useState("");
  const [now, setNow] = useState(Date.now());
  const [errorVersion, setErrorVersion] = useState(0);
  const [locked, setLocked] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [accountDisabled, setAccountDisabled] = useState(false);
  const [resent, setResent] = useState(false);
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [codeBlocked, setCodeBlocked] = useState(false);
  const [resendBlocked, setResendBlocked] = useState(false);
  const [codeRetryAt, setCodeRetryAt] = useState<number | null>(null);
  const navigating = useRef(false);
  const focused = useRef(false);
  const checkedOwner = useRef<string | null>(null);
  const failure = (reason: unknown) => {
    setPin("");
    setErrorVersion((version) => version + 1);
    if (reason instanceof MpinError) {
      if (reason.code === "expired-session") setSessionExpired(true);
      if (reason.code === "account-disabled") setAccountDisabled(true);
      if (reason.code === "locked") {
        setLocked(true);
        setRetryAt(reason.retryAt && Number.isFinite(reason.retryAt) ? reason.retryAt : null);
        const current = useMpinStore.getState();
        if (user && current.status) current.setStatus(user.uid, { ...current.status,
          locked: true, lockedUntil: reason.retryAt && Number.isFinite(reason.retryAt) ? reason.retryAt : undefined });
      }
      if (reason.code === "expired-authorization") useMpinStore.getState().invalidateAuthorization();
      if (reason.code === "already-configured") useMpinStore.getState().invalidateStatus();
      if (reason.code === "attempt-limit") setCodeBlocked(true);
      if (reason.code === "resend-limit") setResendBlocked(true);
      if (reason.code === "attempt-limit" || reason.code === "resend-limit") {
        setCodeRetryAt(reason.retryAt && Number.isFinite(reason.retryAt) ? reason.retryAt : null);
      }
      if (reason.code === "code-used") useMpinStore.getState().invalidateAuthorization();
      if (step === "confirm" && ["network", "timeout"].includes(reason.code)) {
        useMpinStore.getState().invalidateAuthorization();
        useMpinStore.getState().invalidateStatus();
        task.setError("We couldn't confirm whether your MPIN was saved. Check MPIN status before trying again.");
      }
    }
    if (step === "confirm" && reason instanceof TypeError) {
      useMpinStore.getState().invalidateAuthorization();
      useMpinStore.getState().invalidateStatus();
      task.setError("We couldn't confirm whether your MPIN was saved. Check MPIN status before trying again.");
    }
  };
  const task = useMpinRequest(failure);

  const go = (next: string, nextMode = mode, replace = false) => {
    if (navigating.current) return;
    navigating.current = true;
    const href = { pathname: "/(mpin)/mpin/[step]" as const, params: { step: next, mode: nextMode } };
    if (replace) router.replace(href); else router.push(href);
  };

  useFocusEffect(useCallback(() => {
    focused.current = true;
    navigating.current = false;
    setPin("");
    setNow(Date.now());
    return () => { focused.current = false; setPin(""); };
  }, []));

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const subscription = AppState.addEventListener("change", (appState) => {
      if (appState !== "active") {
        setPin("");
        task.setError("For your privacy, the MPIN entry was cleared. Please start this step again.");
      }
      setNow(Date.now());
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);

  const serverLockedUntil = state.status?.lockedUntil;
  const cooldownUntil = retryAt ?? serverLockedUntil;
  const cooldownSeconds = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;
  // Timer expiry enables a status recheck, never another attempt by itself.
  const blocked = cooldownSeconds > 0 || locked || !!state.status?.locked || state.status?.remainingAttempts === 0;
  const grant = state.authorization;
  const authorized = validAuthorization(grant, now) && grant.mode === mode;
  useEffect(() => {
    if (focused.current && grant && !validAuthorization(grant, now) && !task.loading) {
      useMpinStore.getState().invalidateAuthorization();
    }
  }, [grant, now, task.loading]);
  const realOwner = !!user && state.owner === user.uid;
  const setupAllowed = realOwner && state.status?.configured === false;
  const canCreate = preview || (mpinApi.enabled && (mode === "setup" ? setupAllowed : realOwner && authorized));
  const draft = state.draft?.mode === mode ? state.draft : null;
  const mandatory = !preview && mpinApi.enabled && realOwner &&
    (state.status === null || !state.status.configured || !state.unlocked);
  const cannotBack = mandatory && ["intro", "login", "unlock", "status", "forgot", "verify-identity"].includes(step);

  const back = () => {
    if (task.isPending() || cannotBack) return;
    useMpinStore.getState().clearDraft();
    if (router.canGoBack()) router.back(); else go("manage", mode, true);
  };

  // A pending operation and mandatory gates cannot be bypassed by hardware back.
  useFocusEffect(useCallback(() => {
    if (step === "login" || step === "unlock") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (task.isPending() || cannotBack || step === "success") return true;
      useMpinStore.getState().clearDraft();
      return false;
    });
    return () => subscription.remove();
  }, [task.loading, cannotBack, step]));

  // Confirmation owns the draft; abandoning it never leaves a PIN in memory.
  useFocusEffect(useCallback(() => () => {
    if (step === "confirm") useMpinStore.getState().clearDraft();
  }, [step]));

  const finishUnlock = () => {
    if (!user || !useMpinStore.getState().acceptUnlock(user.uid)) throw new MpinError("failed");
    setPin("");
    navigating.current = true;
    router.replace((state.returnTo === "/" ? "/(app)/(tabs)" : state.returnTo) as Href);
  };

  const receiveStatus = (status: MpinStatus) => {
    if (!user || !useMpinStore.getState().setStatus(user.uid, status)) throw new MpinError("failed");
    setLocked(false); setRetryAt(null);
    if (step !== "status") return;
    if (!status.configured) go("intro", "setup", true);
    else if (!useMpinStore.getState().unlocked) go("login", "setup", true);
    else {
      navigating.current = true;
      router.replace((state.returnTo === "/" ? "/(app)/(tabs)" : state.returnTo) as Href);
    }
  };
  const checkStatus = () => {
    if (useMpinStore.getState().checkingStatus) return;
    return task.run(mpinApi.status, receiveStatus);
  };
  useEffect(() => {
    if ((step === "status" || step === "manage") && mpinApi.enabled && user &&
      realOwner && !state.checkingStatus && (step === "manage" || !state.status) && checkedOwner.current !== user.uid) {
      checkedOwner.current = user.uid;
      void checkStatus();
    }
  }, [step, user?.uid, realOwner, state.checkingStatus]);

  useEffect(() => {
    if (step !== "status" || !state.status || state.checkingStatus || navigating.current || task.loading) return;
    if (!state.status.configured) go("intro", "setup", true);
    else if (!state.unlocked) go("login", "setup", true);
    else {
      navigating.current = true;
      router.replace((state.returnTo === "/" ? "/(app)/(tabs)" : state.returnTo) as Href);
    }
  }, [step, state.status, state.unlocked, state.checkingStatus, task.loading]);

  useEffect(() => {
    if (!preview && mpinApi.enabled && realOwner && (step === "login" || step === "unlock") &&
      state.unlocked && !state.checkingStatus && !navigating.current) {
      navigating.current = true;
      router.replace((state.returnTo === "/" ? "/(app)/(tabs)" : state.returnTo) as Href);
    }
  }, [step, preview, realOwner, state.unlocked, state.checkingStatus]);

  const showSuccess = () => {
    if (!user || !useMpinStore.getState().complete(user.uid, mode)) throw new MpinError("failed");
    setPin("");
    // Start a clean stack; a successful save must not leave Create/Confirm behind.
    navigation.dispatch({ type: "RESET", payload: { index: 0, routes: [{
      name: "(mpin)/mpin", state: { index: 0, routes: [{ name: "[step]", params: { step: "success", mode } }] },
    }] } });
  };

  const onPinComplete = (value: string) => {
    if (task.loading || !isCompleteMpin(value) || blocked) return;
    if (step === "create") {
      if (!canCreate || !useMpinStore.getState().setDraft(value, mode)) return;
      setPin("");
      go("confirm");
      return;
    }
    if (step === "confirm") {
      if (!draft || !canCreate) return;
      if (draft.pin !== value) {
        task.setError("MPINs don't match. Please try again.");
        setPin("");
        setErrorVersion((version) => version + 1);
        return;
      }
      if (preview) {
        task.setError("The entries match. This is a design preview; no MPIN was saved. The backend is not connected yet.");
        setPin("");
        useMpinStore.getState().clearDraft();
        return;
      }
      void task.run(async (token, signal) => {
        if (mode === "setup") return mpinApi.create(token, value, signal);
        const authorization = useMpinStore.getState().authorization;
        if (!validAuthorization(authorization) || authorization.mode !== mode) throw new MpinError("expired-authorization");
        return mode === "change" ? mpinApi.change(token, authorization.token, value, signal) : mpinApi.reset(token, authorization.token, value, signal);
      }, (response) => { if (response?.success !== true) throw new MpinError("failed"); showSuccess(); });
      return;
    }
    if (preview) {
      setPin("");
      task.setError("Verification is unavailable in this design preview. No MPIN was verified or account unlocked.");
      return;
    }
    if (!realOwner || !state.status?.configured || !mpinApi.enabled) return;
    if (step === "current") {
      void task.run(async (token, signal) => {
        // Current-PIN proof can request email verification, never change the PIN.
        const proof = await mpinApi.authorizeChange(token, value, signal);
        if (!validAuthorization(proof)) throw new MpinError("expired-authorization");
        return mpinApi.requestChangeCode(token, proof.token, signal);
      }, (delivery) => {
        if (!useMpinStore.getState().setDelivery(delivery, "change")) throw new MpinError("failed");
        setPin(""); go("verify-identity", "change");
      });
    } else if (step === "unlock" || step === "login") {
      void task.run(async (token, signal) => {
        const result = await mpinApi.unlock(token, value, signal);
        if (result?.success !== true) throw new MpinError("failed");
        return mpinApi.status(token, signal);
      }, (status) => {
        if (!user || !useMpinStore.getState().setStatus(user.uid, status)) throw new MpinError("failed");
        if (!useMpinStore.getState().unlocked) throw new MpinError("expired-authorization");
        finishUnlock();
      });
    }
  };

  const requestRecovery = () => {
    if (preview) { task.setError("Identity verification requires the backend. No recovery code has been sent."); return; }
    void task.run(mpinApi.requestRecovery, (delivery) => {
      if (!useMpinStore.getState().setDelivery(delivery)) throw new MpinError("failed");
      go("verify-identity", "reset");
    });
  };

  const delivery = state.delivery?.mode === mode ? state.delivery : null;
  const resendSeconds = delivery ? Math.max(0, Math.ceil((delivery.resendAt - now) / 1000)) : 0;
  const deliveryExpired = !!delivery && now >= delivery.expiresAt;
  const codeRetrySeconds = codeRetryAt ? Math.max(0, Math.ceil((codeRetryAt - now) / 1000)) : 0;
  const resendRestricted = resendBlocked && (!codeRetryAt || codeRetrySeconds > 0);
  const verifyIdentity = (code: string) => {
    if (preview) { setPin(""); task.setError("Email verification is not connected. No code was sent or authorization issued."); return; }
    if (codeBlocked || task.isPending()) return;
    if (!delivery || code.length !== 6 || deliveryExpired) { setPin(""); task.setError("That code has expired. Request a new code."); return; }
    const purpose = mode === "change" ? "change" : "reset";
    void task.run((token, signal) => mode === "change"
      ? mpinApi.verifyChangeCode(token, delivery.challengeId, code, signal)
      : mpinApi.verifyRecovery(token, delivery.challengeId, code, signal), (result) => {
      if (!useMpinStore.getState().setAuthorization(result, purpose)) throw new MpinError("expired-authorization");
      setPin(""); go("create", purpose);
    });
  };
  const resend = () => {
    if (resendSeconds || task.isPending() || resendRestricted || (codeBlocked && (!codeRetryAt || codeRetrySeconds > 0))) return;
    if (!delivery) {
      if (mode === "change") go("current", "change", true);
      else requestRecovery();
      return;
    }
    void task.run((token, signal) => mode === "change"
      ? mpinApi.resendChangeCode(token, delivery.challengeId, signal)
      : mpinApi.resendRecovery(token, delivery.challengeId, signal), (next) => {
      if (!useMpinStore.getState().setDelivery(next, mode === "change" ? "change" : "reset")) throw new MpinError("failed");
      setPin(""); setCodeBlocked(false); setResendBlocked(false); setCodeRetryAt(null); setResent(true); setNow(Date.now());
    });
  };

  const goHome = () => {
    router.replace((mode === "change" ? "/(app)/(tabs)/settings" : "/(app)/(tabs)") as Href);
  };
  const recoveryAction = <Button title="Forgot MPIN?" variant="ghost" disabled={task.loading} onPress={() => {
    useMpinStore.getState().clearFlow(); go("forgot", "reset");
  }} style={styles.secondary} />;
  const emergencyAction = (!mpinApi.enabled || state.status?.emergencyAccessAllowed === true) ? <Button title="Emergency SOS" variant="danger"
    onPress={() => { task.cancel(); useMpinStore.getState().clearFlow(); router.push("/(app)/sos"); }} /> : null;
  const logOut = () => { task.cancel(); useMpinStore.getState().clearFlow(); void logout.logout(); };

  if (sessionExpired || accountDisabled) return <MpinLayout title={accountDisabled ? "Account unavailable" : "Log in again"}
    description={accountDisabled ? "This account is disabled. Contact support for help." : "Your session has expired. Log in with your account before using MPIN."}>
    <View style={styles.actions}><Button title="Log out and log in" onPress={logOut} />{emergencyAction}</View>
  </MpinLayout>;

  if (step === "login" || step === "unlock") {
    const entryAllowed = preview || (mpinApi.enabled && realOwner && !!state.status?.configured);
    const message = blocked
      ? (cooldownSeconds ? `Try again in ${cooldownSeconds}s, or reset your MPIN.` : "Your MPIN is temporarily locked. Check its status or reset your MPIN.")
      : task.error ?? (!entryAllowed ? "Check your MPIN status before continuing." : null);
    return <MpinUnlockExperience value={pin} onChange={(value) => { setPin(value); task.setError(null); }} onComplete={onPinComplete}
      initialEntry={step === "unlock"} isPending={task.isPending} busy={task.loading} disabled={!!blocked || !entryAllowed}
      error={message} errorVersion={errorVersion} preview={preview} onExit={mandatory ? undefined : back}
      onForgot={() => { useMpinStore.getState().clearFlow(); go("forgot", "reset"); }}
      onCheckStatus={!preview && (blocked || !entryAllowed) ? () => go("status", mode, true) : undefined}
      footer={mandatory ? <>{emergencyAction}<Button title="Log out" variant="ghost" onPress={logOut} /></> : undefined} />;
  }

  if (step === "manage" || step === "status") {
    const unavailable = !mpinApi.enabled;
    return <MpinLayout {...stepCopy[step]} onBack={mandatory ? undefined : back} busy={task.loading || state.checkingStatus}
      error={task.error ?? (unavailable ? "MPIN protection is not active yet. The backend integration is still required." : undefined)}>
      <View style={styles.actions}>
        {!unavailable && <Button title={state.status?.configured ? "Change MPIN" : "Set Up MPIN"}
          disabled={!state.status || task.loading || state.checkingStatus} onPress={() => go(state.status?.configured ? "current" : "intro", state.status?.configured ? "change" : "setup")} />}
        {!unavailable && <Button title="Check MPIN status" variant="outline" onPress={checkStatus} disabled={task.loading || state.checkingStatus} />}
        {mandatory && <>{emergencyAction}<Button title="Log out" variant="ghost" onPress={logOut} /></>}
      </View>
    </MpinLayout>;
  }

  if (step === "success") {
    const confirmed = state.success === mode;
    const title = mode === "setup" ? "MPIN created!" : mode === "change" ? "MPIN changed successfully!" : "MPIN reset successfully!";
    return <MpinLayout title={confirmed || preview ? title : "No MPIN change confirmed"} success={confirmed || preview} preview={preview}
      description={confirmed || preview ? (mode === "setup" ? "Your MPIN is ready. You can now securely access RideGuard." : mode === "change" ? "Your MPIN has been updated. Use your new MPIN the next time verification is required." : "Your new MPIN is ready to use.") : "Check your account's MPIN status before continuing."}>
      <View style={styles.actions}>
        <Button title={preview ? "Back to MPIN previews" : confirmed ? (mode === "change" ? "Done" : mode === "setup" ? "Continue to RideGuard" : "Continue") : "Check MPIN status"}
          onPress={() => preview ? go("manage", mode, true) : confirmed ? goHome() : go("status", mode, true)} />
      </View>
    </MpinLayout>;
  }

  if (step === "intro") return <MpinLayout {...stepCopy.intro} onBack={mandatory ? undefined : back} preview={preview}
    error={!preview && !setupAllowed ? "Check your MPIN status before starting setup." : task.error}>
    <View style={styles.actions}>
      <Button title="Set Up MPIN" disabled={!preview && !setupAllowed} onPress={() => go("create", "setup")} />
      {!preview && !setupAllowed && <Button title="Check MPIN status" variant="outline" onPress={() => go("status", mode, true)} />}
      {mandatory && <>{emergencyAction}<Button title="Log out" variant="ghost" onPress={logOut} /></>}
    </View>
  </MpinLayout>;

  if (step === "forgot") return <MpinLayout {...stepCopy.forgot} onBack={cannotBack ? undefined : back} preview={preview} error={task.error} busy={task.loading}>
    <View style={styles.actions}><Button title="Continue" onPress={requestRecovery} isLoading={task.loading} />
      {!preview && <Text style={[styles.note, { color: theme.textMuted }]}>Verification uses the email address registered to your signed-in account.</Text>}
      <Button title="Back to Enter MPIN" variant="ghost" onPress={() => go("unlock", "setup", true)} disabled={task.loading} />
      {mandatory && emergencyAction}
    </View>
  </MpinLayout>;

  if (step === "verify-identity") return <MpinLayout {...stepCopy[step]}
    title={mode === "change" ? "Confirm MPIN change" : stepCopy[step].title}
    description={preview ? "Design preview only. No email has been sent." : !delivery ? "No active email code. Start verification again to request a new code." : mode === "change" ? "Enter the six-digit code sent to your account's registered email to change your MPIN." : stepCopy[step].description}
    onBack={cannotBack ? undefined : back}
    preview={preview} error={task.error ?? (deliveryExpired ? "That code has expired. Request a new code." : undefined)} busy={task.loading}>
    {delivery && <Text style={[styles.note, { color: theme.textMuted }]}>Sent to {delivery.maskedDestination}</Text>}
    {resent && <Text accessibilityLiveRegion="polite" style={[styles.note, { color: theme.textMuted }]}>A new code was sent. Use the latest email.</Text>}
    <VerificationCodeInput value={pin} onChange={(value) => { setPin(value); task.setError(null); }}
      disabled={task.loading || codeBlocked || (!preview && (!delivery || deliveryExpired))} error={!!task.error || deliveryExpired} />
    <Button title="Verify code" onPress={() => { Keyboard.dismiss(); verifyIdentity(pin); }} isLoading={task.loading}
      disabled={codeBlocked || pin.length !== 6 || (!preview && (!delivery || deliveryExpired))} style={styles.secondary} />
    <Button title={codeRetrySeconds ? `Try again in ${codeRetrySeconds}s` : resendSeconds ? `Resend in ${resendSeconds}s` : !delivery && mode === "change" && !preview ? "Verify current MPIN again" : "Resend Code"} variant="ghost"
      onPress={preview ? () => task.setError("No email is sent in this design preview.") : resend}
      disabled={task.loading || resendSeconds > 0 || resendRestricted || (codeBlocked && (!codeRetryAt || codeRetrySeconds > 0))} style={styles.secondary} />
    {mandatory && emergencyAction}
  </MpinLayout>;

  if (["create", "confirm", "unlock", "current"].includes(step)) {
    const needsDraft = step === "confirm" && !draft;
    const entryAllowed = step === "create" || step === "confirm" ? canCreate : preview || (mpinApi.enabled && realOwner && !!state.status?.configured);
    const unavailableMessage = needsDraft ? "Start by choosing your new MPIN. Temporary entries are cleared when you leave or background the app." :
      !entryAllowed ? "Verify your identity or check your MPIN status before continuing." : null;
    const copy = stepCopy[step];
    const title = step === "create" && mode !== "setup" ? "Create new MPIN" : step === "confirm" && mode !== "setup" ? "Confirm new MPIN" : copy.title;
    return <MpinLayout title={title} description={copy.description} onBack={cannotBack ? undefined : back} preview={preview}
      error={task.error ?? unavailableMessage} busy={task.loading}>
      {blocked && <Text accessibilityRole="alert" style={[styles.note, { color: theme.error }]}>
        {cooldownSeconds ? `Try again in ${cooldownSeconds}s, or reset your MPIN.` : "Your MPIN is temporarily locked. Check its status or reset your MPIN."}
      </Text>}
      <PinPad value={pin} onChange={(value) => { setPin(value); task.setError(null); }} onComplete={onPinComplete}
        disabled={task.loading || blocked || !entryAllowed || needsDraft} error={!!task.error || blocked} errorVersion={errorVersion} />
      {(step === "confirm" || !entryAllowed) && <Button title={canCreate ? "Start again" : mode === "setup" ? "Check MPIN status" : "Verify identity again"}
        variant="ghost" disabled={task.loading} style={styles.secondary} onPress={() => {
          useMpinStore.getState().clearDraft();
          go(canCreate ? "create" : mode === "setup" ? "status" : mode === "change" ? "current" : "forgot", mode, true);
        }} />}
      {step === "confirm" && !preview && <Button title="Check MPIN status" variant="ghost" style={styles.secondary} disabled={task.loading} onPress={() => go("status", mode, true)} />}
      {(step === "unlock" || step === "current") && recoveryAction}
      {blocked && <Button title="Check MPIN status" variant="outline" style={styles.secondary} disabled={task.loading} onPress={() => go("status", mode, true)} />}
      {mandatory && <View style={styles.actions}>{emergencyAction}<Button title="Log out" variant="ghost" onPress={logOut} /></View>}
    </MpinLayout>;
  }

  return <MpinLayout title="MPIN security" description="Choose an MPIN option to continue.">
    <View style={styles.actions}><Button title="MPIN settings" onPress={() => go("manage", mode, true)} /></View>
  </MpinLayout>;
}
