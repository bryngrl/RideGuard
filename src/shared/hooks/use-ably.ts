import type { Message } from "ably";
import { Realtime } from "ably";
import { useEffect, useMemo } from "react";

import { ALERT_CREATED_EVENT } from "@/modules/alerts/constants";
import { getSavedAlerts } from "@/modules/alerts/services/alerts.api";
import { parseAlertFields } from "@/modules/alerts/services/alerts.mapper";
import { useAlertsStore } from "@/modules/alerts/store/alerts.store";
import { getAblyToken } from "@/modules/auth/services/auth.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useDeviceStore } from "@/modules/devices";

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
  const mergeAlerts = useAlertsStore((state) => state.mergeAlerts);

  // LOAD EXISTING ALERTS FROM BACKEND

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const loadSavedAlerts = async () => {
      try {
        const firebaseToken = await user.getIdToken();

        const result = await getSavedAlerts(firebaseToken, {
          limit: 50,
        });

        if (cancelled) return;

        console.log("[Alerts] Loaded from backend:", result.alerts);

        mergeAlerts(result.alerts);
      } catch (error) {
        console.error("[Alerts] Failed to load saved alerts:", error);
      }
    };

    loadSavedAlerts();

    return () => {
      cancelled = true;
    };
  }, [user, mergeAlerts]);

  // DETERMINE WHICH DEVICE CHANNELS WE KNOW ABOUT
  const deviceIds = useMemo(() => {
    const ids = new Set<string>();

    if (cameraDeviceId) {
      ids.add(cameraDeviceId);
    }

    for (const alert of alerts) {
      if (alert.deviceId) {
        ids.add(alert.deviceId);
      }
    }

    return [...ids].sort();
  }, [cameraDeviceId, alerts]);

  const deviceIdsKey = deviceIds.join("|");

  // SUBSCRIBE TO REALTIME ABLY ALERTS
  useEffect(() => {
    if (!user || !deviceIdsKey) {
      console.log("[Ably] Not subscribing", {
        hasUser: !!user,
        deviceIdsKey,
      });
      return;
    }

    const ids = deviceIdsKey.split("|");

    const client = new Realtime({
      authCallback: async (_params, callback) => {
        try {
          const firebaseToken = await user.getIdToken();
          const tokenRequest = await getAblyToken(firebaseToken);

          callback(null, tokenRequest);
        } catch (error) {
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

    const channels = ids.map((deviceId) => {
      const channelName = buildAlertsChannelName(user.uid, deviceId);

      const channel = client.channels.get(channelName);

      channel.subscribe(ALERT_CREATED_EVENT, handleAlert).catch((error) => {
        console.error("[Ably] Failed to subscribe:", channelName, error);
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
