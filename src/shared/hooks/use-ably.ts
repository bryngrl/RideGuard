import { Realtime } from "ably";
import type { Message } from "ably";
import { useEffect, useMemo } from "react";

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
  const alerts = useAlertsStore((state) => state.alerts);
  const upsertAlert = useAlertsStore((state) => state.upsertAlert);

  // The device id isn't reliably in the (non-persisted) device store — e.g. after
  // a restart or for a returning user. So we also learn it from the saved alerts
  // loaded from the backend, and subscribe to every device we know about.
  const deviceIds = useMemo(() => {
    const ids = new Set<string>();
    if (cameraDeviceId) ids.add(cameraDeviceId);
    for (const alert of alerts) {
      if (alert.deviceId) ids.add(alert.deviceId);
    }
    return [...ids].sort();
  }, [cameraDeviceId, alerts]);

  // Stable key so the effect only re-subscribes when the *set* of devices
  // changes, not on every alert update.
  const deviceIdsKey = deviceIds.join("|");

  useEffect(() => {
    // Need an authenticated user and at least one device channel to subscribe to.
    if (!user || !deviceIdsKey) return;

    const ids = deviceIdsKey.split("|");

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

    const handleAlert = (message: Message) => {
      const fields = parseAlertFields(message.data);
      if (fields) {
        upsertAlert(fields);
      }
    };

    // Subscribe to each known device's channel. Subscription errors are handled
    // separately from auth failures so an Ably problem never surfaces as an
    // authentication error.
    const channels = ids.map((deviceId) => {
      const channel = client.channels.get(
        buildAlertsChannelName(user.uid, deviceId),
      );
      channel.subscribe(ALERT_CREATED_EVENT, handleAlert).catch((error) => {
        console.error("Failed to subscribe to the alerts channel:", error);
      });
      return channel;
    });

    return () => {
      for (const channel of channels) {
        channel.unsubscribe(ALERT_CREATED_EVENT, handleAlert);
      }
      client.close();
    };
  }, [user, deviceIdsKey, upsertAlert]);
}
