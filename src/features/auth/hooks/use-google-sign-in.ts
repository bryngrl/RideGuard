import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useCallback, useState } from 'react';

import { firebaseAuth } from '@/lib/firebase';
import { signInWithGoogle as requestGoogleSignIn } from '@/lib/google-signin';

export function useGoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const googleIdToken = await requestGoogleSignIn();

      // The user cancelled Google Sign-In.
      if (!googleIdToken) {
        return;
      }

      const credential = GoogleAuthProvider.credential(googleIdToken);

      await signInWithCredential(firebaseAuth, credential);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google Sign-In failed.';

      console.error('Google Sign-In failed:', error);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
