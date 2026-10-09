import { useEffect, useState } from "react";

import { getCurrentUser } from "../services/auth.api";
import { useAuthStore } from "../store/auth.store";

/**
 * Loads the signed-in user's profile from GET /auth/me and exposes their first
 * name for greetings. Falls back to the Firebase displayName if the request
 * fails, so the UI still shows a real name rather than a mock.
 */
export function useCurrentUser() {
  const user = useAuthStore((state) => state.user);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFirstName(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const firebaseFirstName = user.displayName?.trim().split(/\s+/)[0] || null;

    const load = async () => {
      try {
        const token = await user.getIdToken();
        const profile = await getCurrentUser(token);
        if (cancelled) return;

        const resolved =
          profile.first_name?.trim() ||
          profile.firstName?.trim() ||
          firebaseFirstName;

        setFirstName(resolved ?? null);
      } catch (error) {
        console.error("Failed to load current user:", error);
        if (!cancelled) {
          setFirstName(firebaseFirstName);
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
  }, [user]);

  return { firstName, isLoading };
}
