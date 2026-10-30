import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "firebase/auth";
import { completeOnboarding, getOnboardingProgress, updateOnboardingProgress } from "./onboarding-progress.api";

const pendingKey = (email: string) => `rideguard:onboarding-pending:${email.trim().toLowerCase()}`;
const pendingInSession = new Set<string>();
const syncs = new Map<string, Promise<unknown>>();

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

export async function saveOnboardingStep(email: string, step: OnboardingStep, user?: User, data?: Record<string, unknown>) {
  const key = pendingKey(email);
  pendingInSession.add(key);
  await AsyncStorage.setItem(key, step);
  if (user?.email?.toLowerCase() === email.toLowerCase()) {
    // Serialize checkpoints so a slower Profile request cannot overwrite a
    // newer Vehicle/MPIN checkpoint. A failed save does not block later retries.
    const next = (syncs.get(user.uid) ?? Promise.resolve()).catch(() => undefined)
      .then(async () => updateOnboardingProgress(await user.getIdToken(), user.uid, step, data));
    syncs.set(user.uid, next);
    try { await next; } finally { if (syncs.get(user.uid) === next) syncs.delete(user.uid); }
  }
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
  await syncs.get(user.uid)?.catch(() => undefined);
  const remote = await getOnboardingProgress(await user.getIdToken(), user.uid);
  if (remote) {
    if (remote.completed && remote.mpinConfigured && hasProfile) return "/(app)/(tabs)" as const;
    // The new endpoint returns an unfinished default for accounts created before
    // server checkpoints existed. Profile + configured MPIN establish that the
    // old setup was completed; do not send those riders through setup again.
    // New flows carry an explicit version so genuine unfinished setup resumes.
    if (hasProfile && remote.mpinConfigured && remote.data?.frontendFlowVersion !== 2) {
      await completeOnboarding(await user.getIdToken());
      await clearRegistrationOnboardingPending(user.email);
      return "/(app)/(tabs)" as const;
    }
    if (!hasProfile) {
      // Profile, vehicle and contact are submitted together. Restore the local
      // checkpoint for unsent drafts; the server still guards completion.
      if (Object.hasOwn(onboardingPaths, remote.step) &&
        ["profile", "vehicle", "emergency-contact"].includes(remote.step)) {
        return onboardingPaths[remote.step as OnboardingStep];
      }
      return onboardingPaths.profile;
    }
    if (remote.completed && !remote.mpinConfigured) return onboardingPaths.mpin;
    // An offline optional-hardware skip may be newer than the server checkpoint.
    // Resume at mandatory MPIN; never infer device pairing or test completion.
    if (user.email && ["provision", "button"].includes(remote.step) &&
      await AsyncStorage.getItem(pendingKey(user.email)) === "mpin") return onboardingPaths.mpin;
    if (Object.hasOwn(onboardingPaths, remote.step) && remote.step !== "profile") {
      return remote.step === "mpin" && remote.mpinConfigured
        ? onboardingPaths["complete-setup"] : onboardingPaths[remote.step as OnboardingStep];
    }
    // Older users have a completed personal profile but no server checkpoint.
    // Do not submit profile creation again or silently mark setup complete.
    return onboardingPaths.permission;
  }
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
