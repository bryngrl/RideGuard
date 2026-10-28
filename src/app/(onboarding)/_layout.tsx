import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { onboardingPaths, saveOnboardingStep, type OnboardingStep } from "@/modules/auth/services/registration-progress";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding.store";
import { Redirect, Stack, useGlobalSearchParams, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function OnboardingLayout() {
  const { user, isCheckingAuth } = useAuthStore();
  const segments = useSegments();
  const { source } = useGlobalSearchParams<{ source?: string }>();
  const [draftReady, setDraftReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setDraftReady(false);
    const prepare = async () => {
      if (!useOnboardingStore.persist.hasHydrated()) await useOnboardingStore.persist.rehydrate();
      if (cancelled || !user) return;
      useOnboardingStore.getState().setOwner(user.uid);
      setDraftReady(true);
    };
    void prepare();
    return () => { cancelled = true; };
  }, [user?.uid]);
  const routeSegments: readonly string[] = segments;
  const step = routeSegments.includes("camera") ? "camera" : routeSegments.includes("button") ? "button" : routeSegments[routeSegments.length - 1];
  useEffect(() => {
    if (source !== "settings" && draftReady && user?.email && step && Object.hasOwn(onboardingPaths, step)) {
      void saveOnboardingStep(user.email, step as OnboardingStep).catch(() => undefined);
    }
  }, [draftReady, user?.email, step, source]);

  if (isCheckingAuth) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator /></View>;
  if (!user) return <Redirect href={auth.currentUser?.email
    ? { pathname: "/(public)/check-email", params: { email: auth.currentUser.email } }
    : "/(public)/sign-in"} />;
  if (user.providerData.some((provider) => provider.providerId === "password") && !user.emailVerified) {
    return <Redirect href={{ pathname: "/(public)/check-email", params: { email: user.email ?? "" } }} />;
  }
  if (!draftReady) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator /></View>;
  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
