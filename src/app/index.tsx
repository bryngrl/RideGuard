import { Redirect } from "expo-router";

import { useAuth } from "@/modules/auth";

export default function Index() {
  const {
    isAuthenticated,
    isCheckingAuth,
    isOldUser,
  } = useAuth();

  if (isCheckingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(public)/sign-in" />;
  }

  if (isOldUser === true) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  if (isOldUser === false) {
    return (
      <Redirect href="/(onboarding)/register/profile" />
    );
  }
  return null;
}