import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";

import { useAuthStore } from "@/modules/auth/store/auth.store";

import {
  registerDeviceForPush,
  saveRefreshedPushToken,
} from "../services/push-registration";

/**
 * Registers this device for push notifications once per signed-in user, and
 * keeps the backend token fresh if FCM rotates it while signed in.
 * Call this once, high in the tree (e.g. the root layout).
 */
export function usePushNotifications() {
  const user = useAuthStore((state) => state.user);

  // Remember which user we've registered for, so registration only runs once
  // per login (this effect can re-run when the user reference changes).
  const registeredUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      registeredUidRef.current = null;
      return;
    }

    // Initial registration, once per user.
    if (registeredUidRef.current !== user.uid) {
      registeredUidRef.current = user.uid;

      (async () => {
        try {
          const token = await user.getIdToken();
          await registerDeviceForPush(token);
        } catch (error) {
          console.error("Failed to register for push notifications:", error);
          // Allow another attempt on the next render/login.
          registeredUidRef.current = null;
        }
      })();
    }

    // Re-register whenever FCM hands out a new token, so the backend record is
    // overwritten instead of going stale.
    const subscription = Notifications.addPushTokenListener((token) => {
      const registrationId =
        typeof token.data === "string" ? token.data : "";

      (async () => {
        try {
          const firebaseToken = await user.getIdToken();
          await saveRefreshedPushToken(registrationId, firebaseToken);
        } catch (error) {
          console.error("Failed to save refreshed push token:", error);
        }
      })();
    });

    return () => subscription.remove();
  }, [user]);
}
