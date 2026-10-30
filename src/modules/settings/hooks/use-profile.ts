import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import type { SettingsProfile } from "../types/settings.types";
import { useProfileCacheStore } from "../store/profile-cache.store";

export function useProfile() {
  const authUser = useAuthStore((state) => state.user);
  const isDemo = useAuthStore((state) => state.isDemo);
  const cachedUid = useProfileCacheStore((state) => state.uid);
  const cachedDocument = useProfileCacheStore((state) => state.document);
  const cacheLoading = useProfileCacheStore((state) => state.loading);
  const attemptedAt = useProfileCacheStore((state) => state.attemptedAt);
  const load = useProfileCacheStore((state) => state.load);
  const setCachedPhotoUrl = useProfileCacheStore((state) => state.setPhotoUrl);

  useFocusEffect(useCallback(() => {
    if (authUser && !isDemo) void load(authUser);
  }, [authUser, isDemo, load]));

  const serverProfile = cachedUid === authUser?.uid ? cachedDocument : null;
  const displayNameParts = authUser?.displayName?.trim().split(/\s+/) ?? [];
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
            firstName: serverProfile?.personalInfo?.firstName?.trim() || serverProfile?.personalInfo?.first_name?.trim() || displayNameParts[0] || "",
            lastName: serverProfile?.personalInfo?.lastName?.trim() || serverProfile?.personalInfo?.last_name?.trim() || displayNameParts.slice(1).join(" ") || "",
            phone: serverProfile?.personalInfo?.phoneNumber || serverProfile?.personalInfo?.phone_number || "",
            email: serverProfile?.personalInfo?.email || authUser?.email || "",
            vehicleBrand: serverProfile?.vehicle?.brand || "",
            vehicleModel: serverProfile?.vehicle?.model || "",
            plateNumber: serverProfile?.vehicle?.plateNumber || "",
            photoUrl: serverProfile?.photo_url?.trim() || authUser?.photoURL?.trim() || serverProfile?.personalInfo?.profileImageUrl?.trim() || null,
          },
    [authUser?.displayName, authUser?.email, authUser?.photoURL, isDemo, serverProfile],
  );
  const isLoading = !!authUser && !isDemo && !serverProfile &&
    (cachedUid !== authUser.uid || cacheLoading || !attemptedAt);
  const setPhotoUrl = useCallback((url: string) => {
    if (authUser) setCachedPhotoUrl(authUser.uid, url);
  }, [authUser, setCachedPhotoUrl]);
  return { profile, isLoading, setPhotoUrl };
}
