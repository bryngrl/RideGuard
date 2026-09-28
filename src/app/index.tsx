import { Redirect } from "expo-router";

import { useAuth } from "@/modules/auth";

export default function Index() {
  const { isAuthenticated, isCheckingAuth, isOldUser } = useAuth();

  if (isCheckingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(public)/sign-in" />;
  }

  if (isOldUser === null) {
    return null;
  }

  return (
    <Redirect
      href={
        isOldUser
          ? "/(app)/(tabs)"
          : "/(onboarding)/register/profile"
      }
    />
  );
}
