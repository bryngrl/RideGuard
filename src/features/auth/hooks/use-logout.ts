import { useRouter } from "expo-router";
import { signOut as signOutFromFirebase } from "firebase/auth";
import { useCallback, useState } from "react";

import { getInstallationId } from "@/features/notifications/installation-id";
import { unregisterPushNotification } from "@/features/notifications/notifications.api";
import { firebaseAuth } from "@/lib/firebase";
import { signOutFromGoogle } from "@/lib/google-signin";

export function useLogout() {
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async (): Promise<void> => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setError(null);

    try {
      const installationId = await getInstallationId();

      // This must happen before Firebase logout because the route requires
      // the current user's Firebase ID token.
      await unregisterPushNotification(installationId);

      try {
        await signOutFromGoogle();
      } finally {
        await signOutFromFirebase(firebaseAuth);
      }

      router.replace("/");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to log out.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, router]);

  return {
    logout,
    isLoggingOut,
    error,
  };
}
