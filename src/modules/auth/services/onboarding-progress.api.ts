import { apiClient } from "@/shared/api";
import { APIError } from "@/shared/api/errors";

export type OnboardingProgress = {
  uid: string;
  step: string;
  completedSteps: string[];
  completed: boolean;
  mpinConfigured: boolean;
  data?: Record<string, unknown>;
};
type Envelope<T> = { success: boolean; data: T };
const draftFields = ["firstName", "lastName", "phone", "vehicleBrand", "vehicleModel", "plateNumber", "color", "contactName", "emergencyPhone", "relationship", "savedProfile", "savedContactId", "hardwareSetup"] as const;

/** Only registration fields; never credentials, MPINs, grants or image blobs. */
export function onboardingDraft(data: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(draftFields.filter((key) => typeof data[key] === "string")
    .map((key) => [key, data[key] as string]));
}

function progress(value: Envelope<OnboardingProgress>, uid: string): OnboardingProgress {
  const data = value?.data;
  if (value?.success !== true || data?.uid !== uid || typeof data.step !== "string" ||
    typeof data.completed !== "boolean" || typeof data.mpinConfigured !== "boolean" ||
    !Array.isArray(data.completedSteps) || !data.completedSteps.every((step) => typeof step === "string")) {
    throw new Error("Couldn't restore onboarding. Try again.");
  }
  return data;
}

export async function getOnboardingProgress(token: string, uid: string): Promise<OnboardingProgress | null> {
  try {
    return progress(await apiClient.get<Envelope<OnboardingProgress>>("/auth/onboarding", token), uid);
  } catch (error) {
    // Compatibility with the previous deployment only. An outage or malformed
    // response must never be interpreted as completed onboarding.
    if (error instanceof APIError && error.status === 404) return null;
    throw error;
  }
}

export async function updateOnboardingProgress(token: string, uid: string, step: string, data?: Record<string, unknown>) {
  return progress(await apiClient.patch<Envelope<OnboardingProgress>>("/auth/onboarding", {
    step, data: { ...data, frontendFlowVersion: 2 },
  }, token), uid);
}

export async function completeOnboarding(token: string) {
  const result = await apiClient.post<Envelope<{ success: boolean; completed: boolean }>>("/auth/onboarding/complete", undefined, token);
  if (result?.success !== true || result.data?.success !== true || result.data.completed !== true) {
    throw new Error("Couldn't complete setup. Try again.");
  }
}
