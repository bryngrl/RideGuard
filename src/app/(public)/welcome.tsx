import WelcomeScreen from "@/modules/auth/screens/welcome-screen";
import { postAuthDestination } from "@/modules/auth/services/registration-progress";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";

export default function WelcomeRoute() {
  const router = useRouter();
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isOldUser = useAuthStore((state) => state.isOldUser);
  const user = useAuthStore((state) => state.user);

  useFocusEffect(useCallback(() => {
    if (isCheckingAuth || !isAuthenticated || isOldUser === null || !user) return;
    let cancelled = false;
    void postAuthDestination(user, isOldUser)
      .then((destination) => { if (!cancelled) router.replace(destination); })
      .catch(() => { if (!cancelled) router.replace("/(onboarding)/register/profile"); });
    return () => { cancelled = true; };
  }, [isCheckingAuth, isAuthenticated, isOldUser, router, user]));

  if (isCheckingAuth || isAuthenticated) return null;
  return <WelcomeScreen />;
}
