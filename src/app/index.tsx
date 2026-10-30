import WelcomeScreen from "@/modules/auth/screens/welcome-screen";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { postAuthDestination } from "@/modules/auth/services/registration-progress";
import { auth } from "@/lib/firebase";
import { getVerifiedSuccess } from "@/modules/auth/services/verified-success";
import { useRegistrationDraft } from "@/modules/auth/store/registration-draft.store";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

let hasPlayedIntro = false;

export default function Index() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const isOldUser = useAuthStore((state) => state.isOldUser);
  const user = useAuthStore((state) => state.user);
  const pendingVerificationEmail = useRegistrationDraft((state) => state.verificationEmail);
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

  useFocusEffect(useCallback(() => {
    if (isCheckingAuth || !introFinished) return;

    if (!isAuthenticated) {
      const pending = auth.currentUser;
      if (pending?.email && !pending.emailVerified && pending.providerData.some((provider) => provider.providerId === "password")) {
        router.replace({ pathname: "/(public)/check-email", params: { email: pending.email } });
      } else if (pendingVerificationEmail) {
        router.replace({ pathname: "/(public)/check-email", params: { email: pendingVerificationEmail } });
      }
      return;
    }

    if (isOldUser === null) return;

    if (!user) return;
    let cancelled = false;
    void postAuthDestination(user, isOldUser)
      .then((destination) => {
        if (!cancelled) router.replace(getVerifiedSuccess()?.uid === user.uid
          ? "/(public)/account-verified" : destination);
      })
      .catch(() => {
        if (!cancelled) router.replace("/(onboarding)/register/profile");
      });
    return () => { cancelled = true; };
  }, [introFinished, isAuthenticated, isCheckingAuth, isOldUser, router, user, pendingVerificationEmail]));

  return <WelcomeScreen startup={playIntro} showLanding={introFinished && !isCheckingAuth && !isAuthenticated} />;
}
