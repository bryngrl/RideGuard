import { Redirect, Stack } from "expo-router";
import { useReducedMotion } from "react-native-reanimated";

import { useAuthStore } from "@/modules/auth/store/auth.store";

export default function MpinLayout() {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const checking = useAuthStore((state) => state.isCheckingAuth);
  const onboarded = useAuthStore((state) => state.isOldUser);
  const reducedMotion = useReducedMotion();
  if (checking) return null;
  if (!authenticated) return <Redirect href="/(public)/welcome" />;
  if (onboarded === false) return <Redirect href="/(onboarding)/register/profile" />;
  if (onboarded === null) return null;
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: false,
    animation: reducedMotion ? "none" : "slide_from_right", animationTypeForReplace: "push" }} />;
}
