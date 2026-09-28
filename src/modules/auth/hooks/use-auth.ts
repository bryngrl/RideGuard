import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";

import { auth } from "@/lib/firebase";
import { checkIsOldUser } from "../services/auth.api";
import { useAuthStore } from "../store/auth.store";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const isOldUser = useAuthStore((state) => state.isOldUser);

  const setUser = useAuthStore((state) => state.setUser);
  const setCheckingAuth = useAuthStore((state) => state.setCheckingAuth);
  const setIsOldUser = useAuthStore((state) => state.setIsOldUser);

  useEffect(() => {
    let active = true;
    let latestCheck = 0;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      const checkId = ++latestCheck;

      // If the user is not authenticated, clear the auth state
      if (!firebaseUser) {
        clearAuthState();
        return;
      }

      try {
        setCheckingAuth(true);

        // Get the user’s token.
        const firebaseToken = await firebaseUser.getIdToken();

        // Ask the backend whether their profile exists.
        const hasProfile = await checkIsOldUser(firebaseToken);

        if (!active || checkId !== latestCheck) return;

        // Save the answer in the store.
        setIsOldUser(hasProfile);
        setUser(firebaseUser);
      } catch (error) {
        if (!active || checkId !== latestCheck) return;

        console.error("Failed to check authenticated user:", error);

        setUser(null);
        setIsOldUser(null);
      } finally {
        if (active && checkId === latestCheck) {
          setCheckingAuth(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [setUser, setCheckingAuth, setIsOldUser]);

  return {
    user,
    isAuthenticated,
    isCheckingAuth,
    isOldUser,
  };
}

function clearAuthState() {
  useAuthStore.getState().clearAuth();
}
