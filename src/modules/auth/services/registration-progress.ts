import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "firebase/auth";

const pendingKey = (email: string) => `rideguard:onboarding-pending:${email.trim().toLowerCase()}`;
const pendingInSession = new Set<string>();

export const onboardingPaths = {
  profile: "/(onboarding)/register/profile",
  vehicle: "/(onboarding)/register/vehicle",
  "emergency-contact": "/(onboarding)/register/emergency-contact",
  permission: "/(onboarding)/register/permission",
  camera: "/(onboarding)/devices/camera",
  provision: "/(onboarding)/register/provision",
  button: "/(onboarding)/devices/button",
  mpin: "/(onboarding)/register/mpin",
  "complete-setup": "/(onboarding)/register/complete-setup",
} as const;
export type OnboardingStep = keyof typeof onboardingPaths;

export async function saveOnboardingStep(email: string, step: OnboardingStep) {
  const key = pendingKey(email);
  pendingInSession.add(key);
  await AsyncStorage.setItem(key, step);
}

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
  if (user.email) {
    const key = pendingKey(user.email);
    const saved = await AsyncStorage.getItem(key);
    if (pendingInSession.has(key) || saved) {
      return saved && Object.hasOwn(onboardingPaths, saved)
        ? onboardingPaths[saved as OnboardingStep] : onboardingPaths.profile;
    }
  }
  return hasProfile ? "/(app)/(tabs)" as const : "/(onboarding)/register/profile" as const;
}
