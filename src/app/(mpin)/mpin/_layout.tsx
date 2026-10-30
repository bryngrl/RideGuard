import { Redirect, Stack } from "expo-router";
import { useReducedMotion } from "react-native-reanimated";
import { Platform } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";
import { BrandLoading } from "@/shared/ui/brand-loading";

export default function MpinLayout() {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const checking = useAuthStore((state) => state.isCheckingAuth);
  const onboarded = useAuthStore((state) => state.isOldUser);
  const reducedMotion = useReducedMotion();
  const loading = <BrandLoading fullScreen label="Checking account security" />;
  if (checking) return loading;
  if (!authenticated) return <Redirect href="/(public)/welcome" />;
  if (onboarded === false) return <Redirect href="/(onboarding)/register/profile" />;
  if (onboarded === null) return loading;
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: false,
    animation: reducedMotion || Platform.OS === "android" ? "none" : "slide_from_right", animationTypeForReplace: "push" }} />;
}
