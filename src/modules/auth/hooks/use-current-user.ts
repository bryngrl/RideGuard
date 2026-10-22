import { useEffect, useState } from "react";

import { getCurrentUser } from "../services/auth.api";
import { useAuthStore } from "../store/auth.store";

/**
 * Loads the signed-in user's profile from GET /auth/me and exposes their
 * first/last name and profile photo. Falls back to the Firebase user
 * (displayName, photoURL) if the request fails, so the UI still shows real
 * account data rather than a mock.
 */
export function useCurrentUser() {
  const user = useAuthStore((state) => state.user);
  const isDemo = useAuthStore((state) => state.isDemo);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFirstName(isDemo ? "Demo" : null);
      setLastName(null);
      setPhotoUrl(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const displayNameParts = user.displayName?.trim().split(/\s+/) ?? [];
    const firebaseFirstName = displayNameParts[0] || null;
    const firebaseLastName = displayNameParts.slice(1).join(" ") || null;
    const firebasePhotoUrl = user.photoURL?.trim() || null;

    const load = async () => {
      try {
        const token = await user.getIdToken();
        const profile = await getCurrentUser(token);
        if (cancelled) return;

        const resolvedFirstName =
          profile.first_name?.trim() ||
          profile.firstName?.trim() ||
          firebaseFirstName;
        const resolvedLastName =
          profile.last_name?.trim() ||
          profile.lastName?.trim() ||
          firebaseLastName;
        const resolvedPhotoUrl = profile.picture?.trim() || firebasePhotoUrl;

        setFirstName(resolvedFirstName ?? null);
        setLastName(resolvedLastName ?? null);
        setPhotoUrl(resolvedPhotoUrl ?? null);
      } catch (error) {
        console.error("Failed to load current user:", error);
        if (!cancelled) {
          setFirstName(firebaseFirstName);
          setLastName(firebaseLastName);
          setPhotoUrl(firebasePhotoUrl);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user, isDemo]);

  return { firstName, lastName, photoUrl, isLoading };
}
