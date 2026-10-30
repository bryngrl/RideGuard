import { Redirect, useFocusEffect, useLocalSearchParams, useNavigation, useRouter, useSegments, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, BackHandler, Keyboard, Text, View } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";
import { saveOnboardingStep } from "@/modules/auth/services/registration-progress";
import { useLogout } from "@/modules/settings/hooks/use-logout";
import { useTheme } from "@/shared/hooks/use-theme";
import { Button } from "@/shared/ui/button";
import { PinPad } from "@/shared/ui/pin-pad";
import { VerificationCodeInput } from "@/shared/ui/verification-code-input";

import { MpinLayout, mpinStyles as styles } from "../components/mpin-layout";
import { MpinUnlockExperience } from "../components/mpin-unlock-experience";
import { MpinSettingsMotion } from "../components/mpin-settings-motion";
import { useMpinRequest } from "../hooks/use-mpin-request";
import { MpinError, mpinApi, setupAndUnlockMpin, type MpinMode, type MpinStatus } from "../services/mpin.api";
import { useMpinStore } from "../store/mpin.store";
import { isCompleteMpin, isMpinEntryBlocked, resolveMpinAccess, validAuthorization } from "../utils/mpin-policy";
import { mpinStepRoute } from "../utils/mpin-route";

const stepCopy: Record<string, { title: string; description: string }> = {
  intro: { title: "Secure your RideGuard account", description: "Create a 4-digit MPIN for quick and secure access to your account." },
  create: { title: "Create your MPIN", description: "Choose a 4-digit PIN to secure your account." },
  confirm: { title: "Confirm your MPIN", description: "Re-enter your 4-digit MPIN to confirm." },
  unlock: { title: "Enter your MPIN", description: "Enter your 4-digit PIN to continue." },
  current: { title: "Enter current MPIN", description: "Verify your current MPIN before choosing a new one." },
  forgot: { title: "Forgot your MPIN?", description: "Verify your identity using your registered email address to reset your MPIN." },
  "verify-identity": { title: "Verify your email", description: "Enter the 6-digit code sent to your registered email." },
  status: { title: "Checking your MPIN", description: "We'll check whether your account needs MPIN setup or unlocking." },
  manage: { title: "MPIN security", description: "Manage the MPIN used to access your RideGuard account." },
};

export default function MpinFlowScreen() {
  const params = useLocalSearchParams<{ step?: string; mode?: string; onboarding?: string }>();
  const segments = useSegments();
  const onboarding = params.onboarding === "true" || segments.some((segment) => segment === "(onboarding)");
  const mode: MpinMode = params.mode === "change" || params.mode === "reset" ? params.mode : "setup";
  const step = typeof params.step === "string" ? params.step : "status";
  const preview = false;
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const checkingAuth = useAuthStore((state) => state.isCheckingAuth);
  const user = useAuthStore((state) => state.user);
  const security = useMpinStore();
  if (!checkingAuth && !authenticated) return <Redirect href="/(public)/sign-in" />;
  const management = !onboarding && mpinApi.enabled &&
    (step === "manage" || mode === "change" && step !== "success");
  const access = resolveMpinAccess({ enabled: mpinApi.enabled, demo: false,
    uid: user?.uid ?? null, owner: security.owner, status: security.status, unlocked: security.unlocked });
  if (management && access !== "allowed" && access !== "intro") {
    // A known account with an MPIN can render its unlock UI immediately while
    // the server recheck runs. Do not insert the separate status/Please wait page.
    const unlockStep = security.owner === user?.uid && security.status?.configured ? "login" : "status";
    // Management lives outside the normal app gate. Cover it in place with the
    // existing unlock UI, rather than revealing Change MPIN until Back is used.
    return <MpinStep key={`management-lock/${unlockStep}/${user?.uid}`} step={unlockStep}
      mode="setup" preview={false} onboarding={false} resumeManagement />;
  }
  // Remount local fields when a route's step changes, rather than retaining PINs.
  const screen = <MpinStep key={`${step}/${mode}/${preview}/${onboarding}`} step={step} mode={mode} preview={preview} onboarding={onboarding} />;
  return !onboarding && (step === "manage" || mode === "change")
    ? <MpinSettingsMotion key={`${step}/${mode}`}>{screen}</MpinSettingsMotion> : screen;
}

function MpinStep({ step, mode, preview, onboarding, resumeManagement = false }: {
  step: string; mode: MpinMode; preview: boolean; onboarding: boolean; resumeManagement?: boolean;
}) {
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
  const [requestRetryAt, setRequestRetryAt] = useState(0);
  const navigating = useRef(false);
  const focused = useRef(false);
  const checkedOwner = useRef<string | null>(null);
  const failure = (reason: unknown) => {
    setPin("");
    setErrorVersion((version) => version + 1);
    if (reason instanceof MpinError) {
      if (reason.remoteStatus && user) useMpinStore.getState().setStatus(user.uid, reason.remoteStatus);
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
      if (reason.code === "request-limit" || reason.code === "resend-cooldown") {
        // The current backend sometimes omits retryAt. Apply a local minimum
        // without treating a request throttle as exhausted verification attempts.
        setRequestRetryAt(reason.retryAt ?? Date.now() + 60_000);
      }
      if (step === "verify-identity" && ["network", "timeout", "email-delivery-unavailable"].includes(reason.code)) {
        // A resend may replace the old challenge before email delivery fails.
        useMpinStore.getState().clearFlow();
        task.setError("Code request unconfirmed. Request a new code.");
      }
      if (step === "confirm" && ["network", "timeout"].includes(reason.code)) {
        useMpinStore.getState().invalidateAuthorization();
        useMpinStore.getState().invalidateStatus();
        task.setError("MPIN save unconfirmed. Check its status first.");
      }
    }
    if (step === "confirm" && reason instanceof TypeError) {
      useMpinStore.getState().invalidateAuthorization();
      useMpinStore.getState().invalidateStatus();
      task.setError("MPIN save unconfirmed. Check its status first.");
    }
  };
  const task = useMpinRequest(failure);

  const go = (next: string, nextMode = mode, replace = false) => {
    if (navigating.current) return;
    navigating.current = true;
    const href = mpinStepRoute(next, nextMode, onboarding);
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
        // Backgrounding clears sensitive input as normal lifecycle behavior.
        // It is not a failed PIN attempt and should not show a red error.
        task.setError(null);
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
  // Recovery verifies email independently of the old PIN's guessing lockout.
  const entryBlocked = isMpinEntryBlocked(blocked, mode, grant, now);
  useEffect(() => {
    if (focused.current && grant && !validAuthorization(grant, now) && !task.loading) {
      useMpinStore.getState().invalidateAuthorization();
    }
  }, [grant, now, task.loading]);
  const realOwner = !!user && state.owner === user.uid;
  const directChange = realOwner && state.status?.directChangeEnabled === true;
  const setupAllowed = realOwner && state.status?.configured === false;
  const canCreate = preview || (mpinApi.enabled && (mode === "setup" ? setupAllowed :
    (mode === "change" ? directChange || mpinApi.emailCodesEnabled : mpinApi.emailCodesEnabled) && realOwner && authorized));
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
      if (step === "forgot" && !task.isPending()) {
        go("login", "setup", true);
        return true;
      }
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

  const finishOnboarding = () => {
    if (navigating.current) return;
    if (user?.email) void saveOnboardingStep(user.email, "complete-setup").catch(() => undefined);
    navigating.current = true;
    router.replace("/(onboarding)/register/complete-setup");
  };

  const finishUnlock = () => {
    if (!user || !useMpinStore.getState().acceptUnlock(user.uid, resumeManagement)) throw new MpinError("failed");
    setPin("");
    if (resumeManagement) return;
    if (onboarding) { finishOnboarding(); return; }
    navigating.current = true;
    router.dismissTo((state.returnTo === "/" ? "/(app)/(tabs)" : state.returnTo) as Href);
  };

  const receiveStatus = (status: MpinStatus) => {
    if (!user || !useMpinStore.getState().setStatus(user.uid, status)) throw new MpinError("failed");
    setLocked(false); setRetryAt(null);
    if (resumeManagement) return;
    if (step !== "status") return;
    if (!status.configured) go("intro", "setup", true);
    else if (!useMpinStore.getState().unlocked) go("login", "setup", true);
    else {
      if (onboarding) { finishOnboarding(); return; }
      navigating.current = true;
      router.dismissTo((state.returnTo === "/" ? "/(app)/(tabs)" : state.returnTo) as Href);
    }
  };
  const checkStatus = () => {
    if (useMpinStore.getState().checkingStatus) return;
    return task.run(mpinApi.status, receiveStatus);
  };
  useFocusEffect(useCallback(() => {
    if ((step === "status" || step === "manage") && mpinApi.enabled && user &&
      realOwner && !state.checkingStatus && (step === "manage" || !state.status) && checkedOwner.current !== user.uid) {
      checkedOwner.current = user.uid;
      void checkStatus();
    }
  }, [step, user?.uid, realOwner, state.checkingStatus]));

  useFocusEffect(useCallback(() => {
    if (resumeManagement || step !== "status" || !state.status || state.checkingStatus || navigating.current || task.loading) return;
    if (!state.status.configured) go("intro", "setup", true);
    else if (!state.unlocked) go("login", "setup", true);
    else {
      if (onboarding) { finishOnboarding(); return; }
      navigating.current = true;
      router.dismissTo((state.returnTo === "/" ? "/(app)/(tabs)" : state.returnTo) as Href);
    }
  }, [step, state.status, state.unlocked, state.checkingStatus, task.loading]));

  useFocusEffect(useCallback(() => {
    if (!resumeManagement && !preview && mpinApi.enabled && realOwner && (step === "login" || step === "unlock") &&
      state.unlocked && !state.checkingStatus && !navigating.current) {
      if (onboarding) { finishOnboarding(); return; }
      navigating.current = true;
      router.dismissTo((state.returnTo === "/" ? "/(app)/(tabs)" : state.returnTo) as Href);
    }
  }, [step, preview, realOwner, state.unlocked, state.checkingStatus]));

  const showSuccess = (setupStatus?: MpinStatus) => {
    if (mode === "setup" && (!user || !setupStatus ||
      !useMpinStore.getState().setStatus(user.uid, setupStatus) || !useMpinStore.getState().acceptUnlock(user.uid))) {
      throw new MpinError("failed");
    }
    if (!user || !useMpinStore.getState().complete(user.uid, mode)) throw new MpinError("failed");
    if (mode === "setup") {
      if (!setupStatus || !useMpinStore.getState().setStatus(user.uid, setupStatus) ||
        !useMpinStore.getState().acceptUnlock(user.uid)) throw new MpinError("failed");
    }
    setPin("");
    if (onboarding && mode === "setup") { finishOnboarding(); return; }
    // Start a clean stack; a successful save must not leave Create/Confirm behind.
    navigation.dispatch({ type: "RESET", payload: { index: 0, routes: [{
      name: "(mpin)/mpin", state: { index: 0, routes: [{ name: "[step]", params: { step: "success", mode, ...(onboarding ? { onboarding: "true" } : {}) } }] },
    }] } });
  };

  const onPinComplete = (value: string) => {
    if (task.loading || useMpinStore.getState().checkingStatus || !isCompleteMpin(value) || entryBlocked || Date.now() < requestRetryAt) return;
    if (step === "create") {
      if (!canCreate || !useMpinStore.getState().setDraft(value, mode)) return;
      setPin("");
      go("confirm");
      return;
    }
    if (step === "confirm") {
      if (!draft || !canCreate) return;
      if (draft.pin !== value) {
        task.setError("MPINs don't match. Try again.");
        setPin("");
        setErrorVersion((version) => version + 1);
        return;
      }
      if (preview) {
        task.setError("Preview only. No MPIN saved.");
        setPin("");
        useMpinStore.getState().clearDraft();
        return;
      }
      void task.run(async (token, signal) => {
        if (mode === "setup") {
          return { success: true as const, status: await setupAndUnlockMpin(token, value, signal) };
        }
        const authorization = useMpinStore.getState().authorization;
        if (!validAuthorization(authorization) || authorization.mode !== mode) throw new MpinError("expired-authorization");
        return mode === "change" ? (directChange ? mpinApi.changeDirect : mpinApi.change)(token, authorization.token, value, signal)
          : mpinApi.reset(token, authorization.token, value, signal);
      }, (response) => {
        if (response?.success !== true) throw new MpinError("failed");
        showSuccess("status" in response ? response.status as MpinStatus : undefined);
      });
      return;
    }
    if (preview) {
      setPin("");
      task.setError("Preview only. Verification unavailable.");
      return;
    }
    if (!realOwner || !state.status?.configured || !mpinApi.enabled) return;
    if (step === "current") {
      if (!directChange && !mpinApi.emailCodesEnabled) { task.setError("MPIN changes are currently unavailable."); return; }
      if (directChange) {
        void task.run((token, signal) => mpinApi.authorizeChange(token, value, signal), (proof) => {
          if (!useMpinStore.getState().setAuthorization(proof, "change")) throw new MpinError("expired-authorization");
          setPin(""); go("create", "change");
        });
        return;
      }
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
        finishUnlock();
      });
    }
  };

  const requestRecovery = () => {
    if (Date.now() < requestRetryAt) return;
    if (!mpinApi.emailCodesEnabled) { task.setError("MPIN recovery is currently unavailable."); return; }
    if (preview) { task.setError("Recovery unavailable. No code sent."); return; }
    void task.run(mpinApi.requestRecovery, (delivery) => {
      if (!useMpinStore.getState().setDelivery(delivery)) throw new MpinError("failed");
      setPin(""); setCodeBlocked(false); setResendBlocked(false); setCodeRetryAt(null); setResent(false);
      go("verify-identity", "reset", step === "verify-identity");
    });
  };

  const delivery = state.delivery?.mode === mode ? state.delivery : null;
  const resendSeconds = delivery ? Math.max(0, Math.ceil((delivery.resendAt - now) / 1000)) : 0;
  const deliveryExpired = !!delivery && now >= delivery.expiresAt;
  const codeRetrySeconds = codeRetryAt ? Math.max(0, Math.ceil((codeRetryAt - now) / 1000)) : 0;
  const requestRetrySeconds = Math.max(0, Math.ceil((requestRetryAt - now) / 1000));
  const resendRestricted = resendBlocked && (!codeRetryAt || codeRetrySeconds > 0);
  const verifyIdentity = (code: string) => {
    if (!mpinApi.emailCodesEnabled) { task.setError("Email verification is unavailable."); return; }
    if (preview) { setPin(""); task.setError("Verification unavailable. No code sent."); return; }
    if (codeBlocked || task.isPending() || requestRetrySeconds) return;
    if (!delivery || code.length !== 6 || deliveryExpired) { setPin(""); task.setError("Code expired. Request a new one."); return; }
    const purpose = mode === "change" ? "change" : "reset";
    void task.run((token, signal) => mode === "change"
      ? mpinApi.verifyChangeCode(token, delivery.challengeId, code, signal)
      : mpinApi.verifyRecovery(token, delivery.challengeId, code, signal), (result) => {
      if (!useMpinStore.getState().setAuthorization(result, purpose)) throw new MpinError("expired-authorization");
      setPin(""); go("create", purpose);
    });
  };
  const resend = () => {
    if (!mpinApi.emailCodesEnabled) { task.setError("Email verification is unavailable."); return; }
    if (resendSeconds || task.isPending() || resendRestricted || requestRetrySeconds) return;
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
    if (onboarding) { finishOnboarding(); return; }
    router.replace((mode === "change" ? "/(app)/(tabs)/settings" : "/(app)/(tabs)") as Href);
  };
  const recoveryAction = <Button title="Forgot MPIN?" variant="ghost" disabled={task.loading} onPress={() => {
    useMpinStore.getState().clearFlow(); go("forgot", "reset");
  }} style={styles.secondary} />;
  const emergencyAction = (!mpinApi.enabled || state.status?.emergencyAccessAllowed === true) ? <Button title="Emergency SOS" variant="danger"
    onPress={() => { task.cancel(); useMpinStore.getState().clearFlow(); router.push("/(app)/sos"); }} /> : null;
  const logOut = () => { task.cancel(); useMpinStore.getState().clearFlow(); void logout.logout(); };

  if (sessionExpired || accountDisabled) return <MpinLayout onboarding={onboarding} title={accountDisabled ? "Account unavailable" : "Log in again"}
    description={accountDisabled ? "Account disabled. Contact support." : "Your session has expired. Log in with your account before using MPIN."}>
    <View style={styles.actions}><Button title="Log in again" onPress={logOut} />{emergencyAction}</View>
  </MpinLayout>;

  if (step === "login" || step === "unlock") {
    const entryAllowed = preview || (mpinApi.enabled && realOwner && !!state.status?.configured);
    const message = blocked
      ? (cooldownSeconds ? `Try again in ${cooldownSeconds}s, or reset your MPIN.` : "MPIN locked. Check its status or reset it.")
      : task.error ?? (!entryAllowed ? "Check your MPIN status before continuing." : null);
    return <MpinUnlockExperience value={pin} onChange={(value) => { setPin(value); task.setError(null); }} onComplete={onPinComplete}
      initialEntry isPending={() => task.isPending() || state.checkingStatus} busy={task.loading || state.checkingStatus}
      disabled={!!blocked || !entryAllowed || state.checkingStatus || requestRetrySeconds > 0}
      error={message} errorVersion={errorVersion} preview={preview} onExit={mandatory ? undefined : back}
      onForgot={() => { useMpinStore.getState().clearFlow(); go("forgot", "reset"); }}
      footer={mandatory ? emergencyAction : undefined} />;
  }

  if (step === "manage" || step === "status") {
    const unavailable = !mpinApi.enabled;
    return <MpinLayout onboarding={onboarding} {...stepCopy[step]} onBack={mandatory ? undefined : back} busy={task.loading || state.checkingStatus}
      error={task.error ?? (unavailable ? "MPIN is currently unavailable." : undefined)}>
      <View style={styles.actions}>
        {!unavailable && <Button title={state.status?.configured ? "Change MPIN" : "Set Up MPIN"}
          disabled={!state.status || task.loading || state.checkingStatus} onPress={() => go(state.status?.configured ? "current" : "intro", state.status?.configured ? "change" : "setup")} />}
        {!unavailable && task.error && <Button title="Try again" variant="outline" onPress={checkStatus} disabled={task.loading || state.checkingStatus} />}
        {mandatory && emergencyAction}
      </View>
    </MpinLayout>;
  }

  if (step === "success") {
    const confirmed = state.success === mode;
    const title = mode === "setup" ? "MPIN created!" : mode === "change" ? "MPIN changed successfully!" : "MPIN reset successfully!";
    return <MpinLayout onboarding={onboarding} title={confirmed || preview ? title : "No MPIN change confirmed"} success={confirmed || preview} preview={preview}
      description={confirmed || preview ? (mode === "setup" ? "Your MPIN is ready. You can now securely access RideGuard." : mode === "change" ? "Your MPIN has been updated. Use your new MPIN the next time verification is required." : "Your new MPIN is ready to use.") : "Check your account's MPIN status before continuing."}>
      <View style={styles.actions}>
        <Button title={preview ? "Back to MPIN previews" : confirmed ? (mode === "change" ? "Done" : mode === "setup" ? "Continue to RideGuard" : "Continue") : "Try again"}
          onPress={() => preview ? go("manage", mode, true) : confirmed ? goHome() : go("status", mode, true)} />
      </View>
    </MpinLayout>;
  }

  if (step === "intro") return <MpinLayout onboarding={onboarding} {...stepCopy.intro} onBack={mandatory ? undefined : back} preview={preview}
    error={!preview && !setupAllowed ? "Check MPIN status before setup." : task.error}>
    <View style={styles.actions}>
      <Button title="Set Up MPIN" disabled={!preview && !setupAllowed} onPress={() => go("create", "setup")} />
      {!preview && !setupAllowed && <Button title="Try again" variant="outline" onPress={() => go("status", mode, true)} />}
      {mandatory && emergencyAction}
    </View>
  </MpinLayout>;

  if (step === "forgot") return <MpinLayout onboarding={onboarding} {...stepCopy.forgot}
    error={task.error} busy={task.loading}>
    <Text style={[styles.note, { color: theme.textMuted }]}>We'll send a six-digit code to</Text>
    <Text style={[styles.note, { color: theme.accent }]}>{user?.email}</Text>
    <Button title={requestRetrySeconds ? `Try again in ${requestRetrySeconds}s` : "Send reset code"} onPress={requestRecovery}
      disabled={task.loading || !user?.email || !mpinApi.emailCodesEnabled || requestRetrySeconds > 0} style={styles.secondary} />
  </MpinLayout>;

  if (!mpinApi.emailCodesEnabled && (step === "verify-identity" || step === "current" && !directChange)) {
    return <MpinLayout onboarding={onboarding} title={mode === "change" ? "Change MPIN" : "Forgot your MPIN?"}
      description="Email verification is currently unavailable." error={task.error}>
      <View style={styles.actions}>
        <Button title={mandatory ? "Back to Enter MPIN" : "Back to MPIN settings"}
          onPress={() => go(mandatory ? "login" : "manage", "setup", true)} />
      </View>
    </MpinLayout>;
  }

  if (step === "verify-identity") return <MpinLayout onboarding={onboarding} {...stepCopy[step]}
    title={mode === "change" ? "Confirm MPIN change" : stepCopy[step].title}
    description={preview ? "Design preview only. No email has been sent." : !delivery ? "No active email code. Start verification again to request a new code." : mode === "change" ? "Enter the six-digit code sent to your account's registered email to change your MPIN." : stepCopy[step].description}
    onBack={cannotBack ? undefined : back}
    preview={preview} error={task.error ?? (deliveryExpired ? "Code expired. Request a new one." : undefined)} busy={task.loading}>
    {delivery && <Text style={[styles.note, { color: theme.textMuted }]}>Sent to {delivery.maskedDestination}</Text>}
    {resent && <Text accessibilityLiveRegion="polite" style={[styles.note, { color: theme.textMuted }]}>A new code was sent. Use the latest email.</Text>}
    <VerificationCodeInput value={pin} onChange={(value) => { setPin(value); task.setError(null); }}
      disabled={task.loading || codeBlocked || (!preview && (!delivery || deliveryExpired))} error={!!task.error || deliveryExpired} />
    <Button title="Verify code" onPress={() => { Keyboard.dismiss(); verifyIdentity(pin); }}
      disabled={task.loading || codeBlocked || requestRetrySeconds > 0 || pin.length !== 6 || (!preview && (!delivery || deliveryExpired))} style={styles.secondary} />
    <Button title={requestRetrySeconds ? `Try again in ${requestRetrySeconds}s` : codeRetrySeconds ? `Try again in ${codeRetrySeconds}s` : resendSeconds ? `Resend in ${resendSeconds}s` : !delivery && mode === "change" && !preview ? "Verify current MPIN again" : "Resend Code"} variant="ghost"
      onPress={preview ? () => task.setError("No email is sent in this design preview.") : resend}
      disabled={task.loading || resendSeconds > 0 || resendRestricted || requestRetrySeconds > 0} style={styles.secondary} />
    {mandatory && emergencyAction}
  </MpinLayout>;

  if (["create", "confirm", "unlock", "current"].includes(step)) {
    const needsDraft = step === "confirm" && !draft;
    const entryAllowed = step === "create" || step === "confirm" ? canCreate : preview || (mpinApi.enabled && realOwner && !!state.status?.configured);
    const unavailableMessage = needsDraft ? "MPIN entry expired. Choose a new MPIN." :
      !entryAllowed ? "Verify your identity or check MPIN status." : null;
    const copy = stepCopy[step];
    const title = step === "create" && mode !== "setup" ? "Create new MPIN" : step === "confirm" && mode !== "setup" ? "Confirm new MPIN" : copy.title;
    return <MpinLayout onboarding={onboarding} title={title} description={copy.description} onBack={cannotBack ? undefined : back} preview={preview}
      error={task.error ?? unavailableMessage} busy={task.loading || state.checkingStatus}>
      {entryBlocked && <Text accessibilityRole="alert" style={[styles.note, { color: theme.error }]}>
        {cooldownSeconds ? `Try again in ${cooldownSeconds}s, or reset your MPIN.` : "MPIN locked. Check its status or reset it."}
      </Text>}
      <PinPad value={pin} onChange={(value) => { setPin(value); task.setError(null); }} onComplete={onPinComplete}
        disabled={task.loading || state.checkingStatus || entryBlocked || !entryAllowed || needsDraft || requestRetrySeconds > 0} error={!!task.error || entryBlocked} errorVersion={errorVersion} />
      {(step === "confirm" || !entryAllowed) && <Button title={canCreate ? "Start again" : mode === "setup" ? "Try again" : "Verify identity again"}
        variant="ghost" disabled={task.loading} style={styles.secondary} onPress={() => {
          useMpinStore.getState().clearDraft();
          go(canCreate ? "create" : mode === "setup" ? "status" : mode === "change" ? "current" : "forgot", mode, true);
        }} />}
      {(step === "unlock" || step === "current") && recoveryAction}
      {entryBlocked && <Button title="Try again" variant="outline" style={styles.secondary} disabled={task.loading} onPress={() => go("status", mode, true)} />}
      {mandatory && emergencyAction && <View style={styles.actions}>{emergencyAction}</View>}
    </MpinLayout>;
  }

  return <MpinLayout onboarding={onboarding} title="MPIN security" description="Choose an MPIN option to continue.">
    <View style={styles.actions}><Button title="MPIN settings" onPress={() => go("manage", mode, true)} /></View>
  </MpinLayout>;
}
