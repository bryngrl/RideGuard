import { checkIsOldUser } from "@/features/auth/auth.api";
import { firebaseAuth } from "@/lib/firebase";
import { signInWithGoogle } from "@/lib/google-signin";
import { useRouter } from "expo-router";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_ERROR_MESSAGE = "Google Sign-In failed. Please try again.";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
}

export function useGoogleSignIn() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A ref stores a value without causing another render.
  const isMountedRef = useRef(false);
  const isSigningInRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const signIn = useCallback(async () => {
    // Prevent two sign-in requests from running together.
    if (isSigningInRef.current) {
      return;
    }

    isSigningInRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const googleIdToken = await signInWithGoogle();

      const credential = GoogleAuthProvider.credential(googleIdToken);

      await signInWithCredential(firebaseAuth, credential);

      const isOldUser = await checkIsOldUser();

      // The login screen may have closed while waiting.
      if (!isMountedRef.current) {
        return;
      }

      // Finish the state update before leaving this screen.
      setIsLoading(false);

      router.replace(isOldUser ? "/(tabs)" : "/auth/register-1");
    } catch (caughtError) {
      console.error(DEFAULT_ERROR_MESSAGE, caughtError);

      if (!isMountedRef.current) {
        return;
      }

      setError(getErrorMessage(caughtError));
      setIsLoading(false);
    } finally {
      isSigningInRef.current = false;
    }
  }, [router]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    signIn,
    isLoading,
    error,
    clearError,
  };
}
