import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { useGlobalSearchParams, useSegments } from "expo-router";

import { useAuthStore } from "@/modules/auth/store/auth.store";
import { APIError } from "@/shared/api/errors";

import { getInstallationId } from "../services/installation-id";
import { registerPushNotification } from "../services/notifications.api";

/**
 * Registers this device's FCM push token with the backend whenever a user is
 * signed in, and re-registers if the token later rotates. Mounted once near the
 * app root. Unregistration happens on logout (see `use-logout.ts`), while the
 * Firebase token is still valid.
 */
export function usePushRegistration() {
  const user = useAuthStore((state) => state.user);
  const checkingAuth = useAuthStore((state) => state.isCheckingAuth);
  const profileComplete = useAuthStore((state) => state.isOldUser);
  const segments = useSegments();
  const { source } = useGlobalSearchParams<{ source?: string }>();
  const onboarding = segments.some((segment) => segment === "(onboarding)");
  const enabled = !checkingAuth && profileComplete === true && (!onboarding || source === "settings");

  // Avoid re-running the whole flow on every token refresh / user-object change.
  const registeredUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      registeredUidRef.current = null;
      return;
    }
    if (!enabled) return;

    let cancelled = false;
    let inFlight = false;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    // Send a given FCM token to the backend for the current user.
    const register = async (fcmToken: string) => {
      if (cancelled) return;
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

        if (!cancelled) registeredUidRef.current = user.uid;
      } catch (error) {
        if (!cancelled) {
          registeredUidRef.current = null;
          console.warn("[Push] Registration unavailable; retrying on resume.",
            error instanceof APIError ? `HTTP ${error.status}` : "Request failed");
        }
      }
    };

    const run = async () => {
      if (cancelled || inFlight || registeredUidRef.current === user.uid) return;
      inFlight = true;

      try {
        // Push tokens aren't available on simulators/emulators.
        if (!Device.isDevice) {
          console.log("[Push] Skipping registration (not a physical device)");
          return;
        }

        let { granted } = await Notifications.getPermissionsAsync();
        if (cancelled) return;
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
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("SERVICE_NOT_AVAILABLE")) {
          if (retryCount < 3) {
            const delay = [5000, 15000, 30000][retryCount++];
            console.log(`[Push] Service unavailable; retrying in ${delay / 1000}s.`);
            retryTimer = setTimeout(() => {
              retryTimer = null;
              void run();
            }, delay);
          } else {
            console.log("[Push] Service still unavailable; will retry when the app resumes.");
          }
        } else {
          console.warn("[Push] Registration unavailable; retrying on resume.");
        }
      } finally {
        inFlight = false;
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
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (cancelled || inFlight || state !== "active" || registeredUidRef.current === user.uid) return;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      retryCount = 0;
      void run();
    });

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      subscription.remove();
      appStateSubscription.remove();
    };
  }, [user, enabled]);
}
