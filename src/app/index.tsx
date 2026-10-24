import WelcomeScreen from "@/modules/auth/screens/welcome-screen";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { auth } from "@/lib/firebase";
import { postAuthDestination } from "@/modules/auth/services/registration-progress";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

let hasPlayedIntro = false;

export default function Index() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const isOldUser = useAuthStore((state) => state.isOldUser);
  const user = useAuthStore((state) => state.user);
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

    if (!isAuthenticated) {
      const pendingUser = auth.currentUser;
      if (pendingUser && !pendingUser.emailVerified &&
          pendingUser.providerData.some((provider) => provider.providerId === "password") && pendingUser.email) {
        router.replace({ pathname: "/(public)/check-email", params: { email: pendingUser.email } });
      }
      return;
    }

    if (isOldUser === null) return;

    if (!user) return;
    let cancelled = false;
    void postAuthDestination(user, isOldUser)
      .then((destination) => {
        if (!cancelled) router.replace(destination);
      })
      .catch(() => {
        if (!cancelled) router.replace(isOldUser ? "/(app)/(tabs)" : "/(onboarding)/register/profile");
      });
    return () => { cancelled = true; };
  }, [introFinished, isAuthenticated, isCheckingAuth, isOldUser, router, user]);

  return <WelcomeScreen startup={playIntro} showLanding={introFinished && !isCheckingAuth && !isAuthenticated} />;
}
