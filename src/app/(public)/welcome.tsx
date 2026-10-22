import WelcomeScreen from "@/modules/auth/screens/welcome-screen";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { Redirect } from "expo-router";

export default function WelcomeRoute() {
  const auth = useAuthStore();
  if (auth.isCheckingAuth) return null;
  if (auth.isAuthenticated) {
    if (auth.isOldUser === null) return null;
    return <Redirect href={auth.isOldUser ? "/(app)/(tabs)" : "/(onboarding)/register/profile"} />;
  }
  return <WelcomeScreen />;
}
