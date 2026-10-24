import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "firebase/auth";

const pendingKey = (email: string) => `rideguard:onboarding-pending:${email.trim().toLowerCase()}`;
const pendingInSession = new Set<string>();

export async function markRegistrationOnboardingPending(email: string) {
  const key = pendingKey(email);
  pendingInSession.add(key);
  await AsyncStorage.setItem(key, "true").catch(() => undefined);
}

export async function clearRegistrationOnboardingPending(email: string | null | undefined) {
  if (!email) return;
  const key = pendingKey(email);
  pendingInSession.delete(key);
  await AsyncStorage.removeItem(key);
}

export async function postAuthDestination(user: User, hasProfile: boolean) {
  const passwordAccount = user.providerData.some((provider) => provider.providerId === "password");
  if (passwordAccount && user.email) {
    const key = pendingKey(user.email);
    if (pendingInSession.has(key) || await AsyncStorage.getItem(key)) {
      return "/(onboarding)/register/profile" as const;
    }
  }
  return hasProfile ? "/(app)/(tabs)" as const : "/(onboarding)/register/profile" as const;
}
