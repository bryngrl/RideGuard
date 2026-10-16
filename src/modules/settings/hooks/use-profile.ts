import { useCurrentUser } from "@/modules/auth";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useOnboardingStore } from "@/modules/onboarding";
import { normalizePhoneNumber } from "@/shared/lib/phone-utils";
import { useMemo } from "react";
import type { SettingsProfile } from "../types/settings.types";

// BACKEND: replace these local sources with GET /profile/me once available.
export function useProfile() {
  const onboarding = useOnboardingStore();
  const authUser = useAuthStore((state) => state.user);
  // Onboarding is filled in during setup; fall back to the signed-in
  // account's name/photo (GET /auth/me, then Firebase) when it isn't, so
  // Settings never shows a mock name or avatar.
  const {
    firstName: accountFirstName,
    lastName: accountLastName,
    photoUrl,
  } = useCurrentUser();
  const profile = useMemo<SettingsProfile>(
    () => ({
      firstName: onboarding.firstName || accountFirstName || "",
      lastName: onboarding.lastName || accountLastName || "",
      phone: normalizePhoneNumber(onboarding.phone),
      email: authUser?.email ?? "",
      vehicleBrand: onboarding.vehicleBrand,
      vehicleModel: onboarding.vehicleModel,
      plateNumber: onboarding.plateNumber,
      photoUrl,
    }),
    [accountFirstName, accountLastName, authUser?.email, onboarding, photoUrl],
  );
  return { profile, isLoading: false };
}
