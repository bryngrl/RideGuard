import { useCurrentUser } from "@/modules/auth";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useOnboardingStore } from "@/modules/onboarding";
import { normalizePhoneNumber } from "@/shared/lib/phone-utils";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import type { SettingsProfile } from "../types/settings.types";
import { getProfile, type ProfileDocument } from "../services/profile.api";

export function useProfile() {
  const onboarding = useOnboardingStore();
  const authUser = useAuthStore((state) => state.user);
  const isDemo = useAuthStore((state) => state.isDemo);
  const [serverProfile, setServerProfile] = useState<ProfileDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setPhotoUrl = useCallback((url: string) => {
    setServerProfile((current) => ({ ...current, photo_url: url }));
  }, []);

  useFocusEffect(useCallback(() => {
    if (!authUser || isDemo) return;
    let active = true;
    setIsLoading(true);
    getProfile().then((next) => {
      if (active) setServerProfile(next);
    }).catch((error) => {
      console.error("Failed to load profile:", error);
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [authUser, isDemo]));
  // Onboarding is filled in during setup; fall back to the signed-in
  // account's name/photo (GET /auth/me, then Firebase) when it isn't, so
  // Settings never shows a mock name or avatar.
  const {
    firstName: accountFirstName,
    lastName: accountLastName,
    photoUrl,
  } = useCurrentUser();
  const profile = useMemo<SettingsProfile>(
    () =>
      isDemo
        ? {
            firstName: "Demo",
            lastName: "",
            phone: "",
            email: "",
            vehicleBrand: "",
            vehicleModel: "",
            plateNumber: "",
            photoUrl: null,
          }
        : {
            firstName: serverProfile?.personalInfo?.firstName || onboarding.firstName || accountFirstName || "",
            lastName: serverProfile?.personalInfo?.lastName || onboarding.lastName || accountLastName || "",
            phone: normalizePhoneNumber(serverProfile?.personalInfo?.phoneNumber || onboarding.phone),
            email: serverProfile?.personalInfo?.email || authUser?.email || "",
            vehicleBrand: serverProfile?.vehicle?.brand || onboarding.vehicleBrand,
            vehicleModel: serverProfile?.vehicle?.model || onboarding.vehicleModel,
            plateNumber: serverProfile?.vehicle?.plateNumber || onboarding.plateNumber,
            photoUrl: serverProfile?.photo_url || serverProfile?.personalInfo?.profileImageUrl || photoUrl,
          },
    [accountFirstName, accountLastName, authUser?.email, isDemo, onboarding, photoUrl, serverProfile],
  );
  return { profile, isLoading, setPhotoUrl };
}
