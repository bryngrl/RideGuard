import { auth } from "@/lib/firebase";
import { saveOnboardingStep } from "@/modules/auth/services/registration-progress";
import { onboardingDraft } from "@/modules/auth/services/onboarding-progress.api";
import { useOnboardingStore } from "../store/onboarding.store";

/** Only a checkpoint: never modify device ownership or report a passed test. */
export async function skipHardware(stage: "connection-skipped" | "tests-skipped") {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Sign in to continue setup.");
  const store = useOnboardingStore.getState();
  store.updateDraft({ hardwareSetup: stage });
  // saveOnboardingStep writes locally before syncing the existing backend data
  // map. Offline sync must not trap a rider in an optional hardware step.
  await saveOnboardingStep(user.email, "mpin");
  void saveOnboardingStep(user.email, "mpin", user,
    onboardingDraft(useOnboardingStore.getState() as unknown as Record<string, unknown>)).catch(() => undefined);
}
