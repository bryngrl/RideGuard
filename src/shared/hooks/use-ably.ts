import { Realtime } from "ably";
import type { Message } from "ably";
import { useEffect } from "react";

import { getAblyToken } from "@/modules/auth/services/auth.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useAlertsStore } from "@/modules/alerts/store/alerts.store";
import { parseAlertFields } from "@/modules/alerts/services/alerts.mapper";
import { ALERT_CREATED_EVENT } from "@/modules/alerts/constants";
import { useDeviceStore } from "@/modules/devices";

/**
 * Builds the exact per-user/per-device alerts channel the backend publishes to:
 * rideguard:alerts:user:<encoded uid>:device:<encoded deviceId>
 */
function buildAlertsChannelName(userId: string, deviceId: string): string {
  return `rideguard:alerts:user:${encodeURIComponent(
    userId,
  )}:device:${encodeURIComponent(deviceId)}`;
}

export function useAbly() {
  const user = useAuthStore((state) => state.user);
  const cameraDeviceId = useDeviceStore((state) => state.cameraDeviceId);
  const upsertAlert = useAlertsStore((state) => state.upsertAlert);

  useEffect(() => {
    // Need both an authenticated user and an assigned device to open the
    // exact channel. Without the device id there is nothing to subscribe to.
    if (!user || !cameraDeviceId) return;

    const client = new Realtime({
      authCallback: async (_params, callback) => {
        try {
          const firebaseToken = await user.getIdToken();
          const tokenRequest = await getAblyToken(firebaseToken);

          callback(null, tokenRequest);
        } catch (error) {
          // Authentication failures are reported through the auth callback.
          callback(
            error instanceof Error
              ? error.message
              : "Ably authentication failed.",
            null,
          );
        }
      },
    });

    const channelName = buildAlertsChannelName(user.uid, cameraDeviceId);
    const channel = client.channels.get(channelName);

    const handleAlert = (message: Message) => {
      const fields = parseAlertFields(message.data);
      if (fields) {
        upsertAlert(fields);
      }
    };

    // Subscription errors are handled separately from auth failures so an Ably
    // problem never surfaces as an authentication error.
    channel.subscribe(ALERT_CREATED_EVENT, handleAlert).catch((error) => {
      console.error("Failed to subscribe to the alerts channel:", error);
    });

    return () => {
      channel.unsubscribe(ALERT_CREATED_EVENT, handleAlert);
      client.close();
    };
  }, [user, cameraDeviceId, upsertAlert]);
}
