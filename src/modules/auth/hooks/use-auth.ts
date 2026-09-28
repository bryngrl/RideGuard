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
  const isOldUser = useAuthStore(
    (state) => state.isOldUser,
  );

  const setUser = useAuthStore((state) => state.setUser);
  const setCheckingAuth = useAuthStore(
    (state) => state.setCheckingAuth,
  );
  const setIsOldUser = useAuthStore(
    (state) => state.setIsOldUser,
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {

        if (!firebaseUser) {
          setUser(null);
          setIsOldUser(null);
          setCheckingAuth(false);
          return;
        }

        try {
          setCheckingAuth(true);

          const firebaseToken =
            await firebaseUser.getIdToken();

          const oldUser =
            await checkIsOldUser(firebaseToken);

          setIsOldUser(oldUser);
          setUser(firebaseUser);
        } catch (error) {
          console.error(
            "Failed to check authenticated user:",
            error,
          );

          setUser(null);
          setIsOldUser(null);
        } finally {
          setCheckingAuth(false);
        }
      },
    );

    return unsubscribe;
  }, [
    setUser,
    setCheckingAuth,
    setIsOldUser,
  ]);

  return {
    user,
    isAuthenticated,
    isCheckingAuth,
    isOldUser,
  };
}