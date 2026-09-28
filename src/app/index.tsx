import { Redirect } from "expo-router";

import { useAuth } from "@/modules/auth";

export default function Index() {
  const { isAuthenticated, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(public)/sign-in" />;
  }

  return <Redirect href="/(onboarding)/register/profile" />;
}
