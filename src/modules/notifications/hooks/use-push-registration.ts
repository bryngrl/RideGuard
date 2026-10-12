import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";

import { getInstallationId } from "../services/installation-id";
import { registerPushNotification } from "../services/notifications.api";

/**
 * Registers this device's FCM push token with the backend whenever a user is
 * signed in, and re-registers if the token later rotates. Mounted once near the
 * app root. Unregistration happens on logout (see settings screen), while the
 * Firebase token is still valid.
 */
export function usePushRegistration() {
  const user = useAuthStore((state) => state.user);

  // Avoid re-running the whole flow on every token refresh / user-object change.
  const registeredUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      registeredUidRef.current = null;
      return;
    }

    let cancelled = false;

    // Send a given FCM token to the backend for the current user.
    const register = async (fcmToken: string) => {
      try {
        const [installationId, firebaseToken] = await Promise.all([
          getInstallationId(),
          user.getIdToken(),
        ]);

        if (cancelled) return;

        await registerPushNotification(firebaseToken, {
          installationId,
          registrationId: fcmToken,
          platform: Platform.OS,
          deviceName: Device.deviceName ?? undefined,
        });

        registeredUidRef.current = user.uid;
      } catch (error) {
        console.error("[Push] Failed to register push token:", error);
      }
    };

    const run = async () => {
      if (registeredUidRef.current === user.uid) return;

      try {
        // Push tokens aren't available on simulators/emulators.
        if (!Device.isDevice) {
          console.log("[Push] Skipping registration (not a physical device)");
          return;
        }

        let { granted } = await Notifications.getPermissionsAsync();
        if (!granted) {
          granted = (await Notifications.requestPermissionsAsync()).granted;
        }

        if (!granted || cancelled) {
          console.log("[Push] Notification permission not granted");
          return;
        }

        const token = await Notifications.getDevicePushTokenAsync();
        if (cancelled) return;

        await register(token.data);
      } catch (error) {
        console.error("[Push] Registration flow failed:", error);
      }
    };

    run();

    // Re-register when the native (FCM) token rotates. The listener payload is a
    // string in this SDK but has historically been a { data } object, so accept
    // both defensively.
    const subscription = Notifications.addPushTokenListener((token) => {
      const data =
        typeof token === "string"
          ? token
          : (token as unknown as { data?: string }).data;

      if (data) {
        register(data);
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [user]);
}
