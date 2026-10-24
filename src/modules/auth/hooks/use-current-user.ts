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
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setFirstName(isDemo ? "Demo" : null);
      setLastName(null);
      setPhotoUrl(null);
      setLoadedUid(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setFirstName(null);
    setLastName(null);
    setPhotoUrl(null);
    setLoadedUid(null);

    const displayNameParts = user.displayName?.trim().split(/\s+/) ?? [];
    const firebaseFirstName = displayNameParts[0] || null;
    const firebaseLastName = displayNameParts.slice(1).join(" ") || null;
    const firebasePhotoUrl = user.photoURL?.trim() || null;

    const load = async () => {
      try {
        const token = await user.getIdToken();
        const profile = await getCurrentUser(token);
        if (cancelled) return;

        const backendNameParts = profile.name?.trim().split(/\s+/) ?? [];

        const resolvedFirstName =
          profile.first_name?.trim() ||
          profile.firstName?.trim() ||
          backendNameParts[0] ||
          firebaseFirstName;
        const resolvedLastName =
          profile.last_name?.trim() ||
          profile.lastName?.trim() ||
          backendNameParts.slice(1).join(" ") ||
          firebaseLastName;
        const resolvedPhotoUrl = profile.picture?.trim() || firebasePhotoUrl;

        setFirstName(resolvedFirstName ?? null);
        setLastName(resolvedLastName ?? null);
        setPhotoUrl(resolvedPhotoUrl ?? null);
        setLoadedUid(user.uid);
      } catch (error) {
        console.info("Could not load current user:", error);
        if (!cancelled) {
          setFirstName(firebaseFirstName);
          setLastName(firebaseLastName);
          setPhotoUrl(firebasePhotoUrl);
          setLoadedUid(user.uid);
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

  const readyForUser = !user || loadedUid === user.uid;
  return {
    firstName: readyForUser ? firstName : null,
    lastName: readyForUser ? lastName : null,
    photoUrl: readyForUser ? photoUrl : null,
    isLoading: !!user && (isLoading || !readyForUser),
  };
}
