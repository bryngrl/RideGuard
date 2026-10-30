import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { onboardingPaths, postAuthDestination, saveOnboardingStep, type OnboardingStep } from "@/modules/auth/services/registration-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding.store";
import { getOnboardingProgress, onboardingDraft } from "@/modules/auth/services/onboarding-progress.api";
import { MpinAppGate } from "@/modules/mpin/components/mpin-app-gate";
import { Button } from "@/shared/ui/button";
import { useTheme } from "@/shared/hooks/use-theme";
import { FormFeedback } from "@/shared/ui/form-feedback";
import { Redirect, Stack, useGlobalSearchParams, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OnboardingProgressContext } from "@/shared/ui/onboarding-progress-context";
import Stepper from "@/shared/ui/stepper";
import { MaxContentWidth, Spacing } from "@/shared/theme";

export default function OnboardingLayout() {
  const theme = useTheme();
  const { user, isCheckingAuth, isOldUser } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const { source, camera, test } = useGlobalSearchParams<{ source?: string; camera?: string; test?: string }>();
  const [draftReady, setDraftReady] = useState(false);
  const [restoreFailed, setRestoreFailed] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setDraftReady(false);
    setRestoreFailed(false);
    const prepare = async () => {
      if (!useOnboardingStore.persist.hasHydrated()) await useOnboardingStore.persist.rehydrate();
      if (cancelled || !user) return;
      useOnboardingStore.getState().setOwner(user.uid);
      if (source !== "settings") {
        try {
          if (isOldUser === true && await postAuthDestination(user, true) === "/(app)/(tabs)") {
            if (!cancelled && auth.currentUser?.uid === user.uid) router.replace("/(app)/(tabs)");
            return;
          }
          const progress = await getOnboardingProgress(await user.getIdToken(), user.uid);
          if (cancelled || auth.currentUser?.uid !== user.uid) return;
          if (progress?.data) {
            const local = useOnboardingStore.getState();
            // Keep this installation's unsaved edits ahead of an older sync.
            const restored = Object.fromEntries(Object.entries(onboardingDraft(progress.data))
              .filter(([key]) => !local[key as keyof typeof local]));
            local.updateDraft(restored);
          }
        } catch {
          // Do not turn an unsuccessful legacy migration into a new checkpoint.
          // Retain the draft and allow a retry before syncing any progress.
          if (!cancelled) setRestoreFailed(true);
          return;
        }
      }
      setDraftReady(true);
    };
    void prepare();
    return () => { cancelled = true; };
  }, [user?.uid, source, isOldUser, router, retryVersion]);
  const routeSegments: readonly string[] = segments;
  const step = routeSegments.includes("camera") ? "camera" : routeSegments.includes("button") ? "button" : routeSegments[routeSegments.length - 1];
  const progressStep = step === "camera" ? (camera === "2" ? 6 : 5)
    : step === "button" ? (routeSegments.includes("test-page") || test === "long" ? 8 : 7)
    : ({ profile: 1, vehicle: 2, "emergency-contact": 3, permission: 4, provision: 7, mpin: 9, "complete-setup": 10 } as Record<string, number>)[step] ?? 1;
  useEffect(() => {
    if (source !== "settings" && draftReady && user?.email && step && Object.hasOwn(onboardingPaths, step)) {
      void saveOnboardingStep(user.email, step as OnboardingStep, user,
        onboardingDraft(useOnboardingStore.getState() as unknown as Record<string, unknown>)).catch(() => undefined);
    }
  }, [draftReady, user?.email, step, source]);
  useEffect(() => {
    if (source === "settings" || !draftReady || !user?.email || !step || !Object.hasOwn(onboardingPaths, step)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useOnboardingStore.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (auth.currentUser?.uid !== user.uid) return;
        void saveOnboardingStep(user.email!, step as OnboardingStep, user,
          onboardingDraft(useOnboardingStore.getState() as unknown as Record<string, unknown>)).catch(() => undefined);
      }, 800);
    });
    return () => { clearTimeout(timer); unsubscribe(); };
  }, [draftReady, user?.uid, user?.email, step, source]);

  const loading = <View style={{ flex: 1, backgroundColor: theme.background }} accessibilityState={{ busy: true }} />;
  if (isCheckingAuth) return loading;
  if (!user) return <Redirect href={auth.currentUser?.email
    ? { pathname: "/(public)/check-email", params: { email: auth.currentUser.email } }
    : "/(public)/sign-in"} />;
  if (user.providerData.some((provider) => provider.providerId === "password") && !user.emailVerified) {
    return <Redirect href={{ pathname: "/(public)/check-email", params: { email: user.email ?? "" } }} />;
  }
  if (restoreFailed && source !== "settings") return <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 16 }}>
    <FormFeedback message="Couldn't restore setup. Try again." />
    <Button title="Retry" onPress={() => setRetryVersion((value) => value + 1)} />
  </View>;
  if (!draftReady) return loading;
  const stack = <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
    <Stack.Screen name="register" options={{ animation: Platform.OS === "android" ? "none" : "fade" }} />
  </Stack>;
  // Hardware setup reuses these routes from Settings. Returning from another
  // app must enforce the same lock and preserve the same stack as normal pages.
  return source === "settings" ? <MpinAppGate>{stack}</MpinAppGate> :
    <OnboardingProgressContext.Provider value={true}>
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.background }}>
          {step !== "complete-setup" && <View style={{ width: "100%", maxWidth: MaxContentWidth, alignSelf: "center", paddingHorizontal: Spacing.five, paddingTop: Spacing.four }}>
          <Stepper standalone currentStep={progressStep} steps={10} size={4} />
          </View>}
        <View style={{ flex: 1 }}>{stack}</View>
      </SafeAreaView>
    </OnboardingProgressContext.Provider>;
}
