import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useOnboardingStore } from "@/modules/onboarding";
import { normalizePhoneNumber } from "@/shared/lib/phone-utils";
import { useMemo } from "react";
import type { SettingsProfile } from "../types/settings.types";

// BACKEND: replace these local sources with GET /profile/me once available.
export function useProfile() {
  const onboarding = useOnboardingStore();
  const authUser = useAuthStore((state) => state.user);
  const profile = useMemo<SettingsProfile>(
    () => ({
      firstName: onboarding.firstName,
      lastName: onboarding.lastName,
      phone: normalizePhoneNumber(onboarding.phone),
      email: authUser?.email ?? "",
      vehicleBrand: onboarding.vehicleBrand,
      vehicleModel: onboarding.vehicleModel,
      plateNumber: onboarding.plateNumber,
    }),
    [authUser?.email, onboarding],
  );
  return { profile, isLoading: false };
}
