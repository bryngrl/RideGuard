import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { checkIsOldUser } from "../services/auth.api";
import { useAuthStore } from "../store/auth.store";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated,
  );
  const isCheckingAuth = useAuthStore(
    (state) => state.isCheckingAuth,
  );

  const setUser = useAuthStore((state) => state.setUser);
  const setCheckingAuth = useAuthStore(
    (state) => state.setCheckingAuth,
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!firebaseUser) {
          setUser(null);
          setCheckingAuth(false);
          return;
        }

        try {
          setCheckingAuth(true);

          const firebaseToken = await firebaseUser.getIdToken();

          await checkIsOldUser(firebaseToken);

          setUser(firebaseUser);
        } catch (error) {
          console.error(
            "Failed to check authenticated user:",
            error,
          );

          setUser(null);
        } finally {
          setCheckingAuth(false);
        }
      },
    );

    return unsubscribe;
  }, [setUser, setCheckingAuth]);

  return {
    user,
    isAuthenticated,
    isCheckingAuth,
  };
}