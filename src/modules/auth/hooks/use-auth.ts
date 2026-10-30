import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { APIError } from "@/shared/api/errors";
import { checkIsOldUser, ensureEmailPasswordProfile } from "../services/auth.api";
import { useAuthStore } from "../store/auth.store";
import { isTemporarySessionFailure } from "../utils/session-errors";

export function useAuth() {
  const authRevision = useRef(0);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const retrySession = useCallback(() => setRetryVersion((value) => value + 1), []);
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
        const revision = ++authRevision.current;
        setSessionError(null);

        if (!firebaseUser) {
          setUser(null);
          setIsOldUser(null);
          setCheckingAuth(false);
          return;
        }

        let stage = "firebase-account-refresh";
        try {
          setCheckingAuth(true);
          if (firebaseUser.providerData.some((provider) => provider.providerId === "password")) {
            const wasVerified = firebaseUser.emailVerified;
            await firebaseUser.reload();
            if (revision !== authRevision.current) return;
            if (!firebaseUser.emailVerified) {
              setUser(null);
              setIsOldUser(null);
              return;
            }
            // Only a newly changed verification claim needs a forced refresh.
            if (!wasVerified) await firebaseUser.getIdToken(true);
          }

          stage = "firebase-token";
          const firebaseToken =
            await firebaseUser.getIdToken();

          stage = "rideguard-profile";
          const oldUser = firebaseUser.providerData.some((provider) => provider.providerId === "password")
            ? await ensureEmailPasswordProfile(firebaseUser)
            : await checkIsOldUser(firebaseToken);

          if (revision !== authRevision.current || auth.currentUser?.uid !== firebaseUser.uid) return;
          setIsOldUser(oldUser);
          setUser(firebaseUser);
        } catch (error) {
          if (revision !== authRevision.current) return;
          if (isTemporarySessionFailure(error)) {
            setSessionError("Couldn't connect to RideGuard. Try again.");
          }
          const code = error && typeof error === "object" && "code" in error &&
            typeof error.code === "string" ? error.code : null;
          if (code?.startsWith("auth/")) {
            // Keep the full Firebase code visible on narrow terminals without
            // logging the user object, credentials or a long wrapped stack.
            console.info("RideGuard Firebase session check failed:", { stage, code });
          } else if ((error instanceof APIError && error.status >= 500) || error instanceof TypeError) {
            console.info("RideGuard profile check failed:", error instanceof APIError
              ? { status: error.status, endpoint: error.endpoint }
              : { reason: "network-request-failed" });
          } else {
            // Login displays account setup errors in its form. Logging them as
            // errors here opens a second, unrelated React Native LogBox.
            console.info("Could not confirm the signed-in user's RideGuard profile:", error);
          }

          setUser(null);
          setIsOldUser(null);
        } finally {
          if (revision === authRevision.current) setCheckingAuth(false);
        }
      },
    );

    return () => { authRevision.current++; unsubscribe(); };
  }, [
    setUser,
    setCheckingAuth,
    setIsOldUser,
    retryVersion,
  ]);

  return {
    user,
    isAuthenticated,
    isCheckingAuth,
    isOldUser,
    sessionError,
    retrySession,
  };
}
