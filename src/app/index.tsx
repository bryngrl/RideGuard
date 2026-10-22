import WelcomeScreen from "@/modules/auth/screens/welcome-screen";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

let hasPlayedIntro = false;

export default function Index() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const isOldUser = useAuthStore((state) => state.isOldUser);
  const [playIntro] = useState(() => !hasPlayedIntro);
  const [introFinished, setIntroFinished] = useState(() => hasPlayedIntro);

  useEffect(() => {
    if (!playIntro) return;
    const finishTimeout = setTimeout(() => {
      hasPlayedIntro = true;
      setIntroFinished(true);
    }, 2300);

    return () => {
      clearTimeout(finishTimeout);
    };
  }, [playIntro]);

  useEffect(() => {
    if (isCheckingAuth || !introFinished) return;

    // Keep the splash wordmark mounted as the unauthenticated landing appears.
    if (!isAuthenticated) return;

    if (isOldUser === null) return;

    router.replace(
      isOldUser ? "/(app)/(tabs)" : "/(onboarding)/register/profile",
    );
  }, [introFinished, isAuthenticated, isCheckingAuth, isOldUser, router]);

  return <WelcomeScreen startup={playIntro} showLanding={introFinished && !isCheckingAuth && !isAuthenticated} />;
}
