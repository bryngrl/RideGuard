import type { Message } from "ably";
import { Realtime } from "ably";
import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import { ALERT_CREATED_EVENT } from "@/modules/alerts/constants";
import { getSavedAlerts } from "@/modules/alerts/services/alerts.api";
import { parseAlertFields } from "@/modules/alerts/services/alerts.mapper";
import { useAlertsStore } from "@/modules/alerts/store/alerts.store";
import { getAblyToken } from "@/modules/auth/services/auth.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { getMyCameras } from "@/modules/camera-sensor/services/cameras.api";
import { useDeviceStore } from "@/modules/devices";

function buildAlertsChannelName(userId: string, deviceId: string): string {
  return `rideguard:alerts:user:${encodeURIComponent(
    userId,
  )}:device:${encodeURIComponent(deviceId)}`;
}

export function useAbly() {
  const user = useAuthStore((state) => state.user);
  const camera1DeviceId = useDeviceStore((state) => state.camera1DeviceId);

  const camera2DeviceId = useDeviceStore((state) => state.camera2DeviceId);

  const buttonDeviceId = useDeviceStore((state) => state.buttonDeviceId);

  const alerts = useAlertsStore((state) => state.alerts);
  const upsertAlert = useAlertsStore((state) => state.upsertAlert);
  const mergeAlerts = useAlertsStore((state) => state.mergeAlerts);
  const [ownedCameras, setOwnedCameras] = useState<{
    uid: string;
    ids: string[];
  } | null>(null);

  // LOAD EXISTING ALERTS FROM BACKEND

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      try {
        const firebaseToken = await user.getIdToken();
        // Camera discovery must not depend on having received an alert already.
        // Keep these independent so a failed camera request cannot hide history.
        await Promise.all([
          getMyCameras(firebaseToken)
            .then((cameras) => {
              if (!cancelled) {
                setOwnedCameras({
                  uid: user.uid,
                  ids: cameras.map((camera) => camera.deviceId),
                });
              }
            })
            .catch((error) => {
              console.error("[Ably] Failed to load camera channels:", error);
            }),
          getSavedAlerts(firebaseToken, { limit: 50 })
            .then((page) => {
              if (!cancelled) mergeAlerts(page.alerts);
            })
            .catch((error) => {
              console.error("[Alerts] Failed to load saved alerts:", error);
            }),
        ]);
      } catch (error) {
        console.error("[Alerts] Failed to refresh:", error);
      }
    };

    void refresh();
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });

    return () => {
      cancelled = true;
      appState.remove();
    };
  }, [user, mergeAlerts]);

  // DETERMINE WHICH DEVICE CHANNELS WE KNOW ABOUT
  const deviceIds = useMemo(() => {
    const ids = new Set<string>();

    if (ownedCameras?.uid === user?.uid) {
      for (const id of ownedCameras?.ids ?? []) ids.add(id);
    }

    if (camera1DeviceId) {
      ids.add(camera1DeviceId);
    }
    if (camera2DeviceId) {
      ids.add(camera2DeviceId);
    }
    if (buttonDeviceId) {
      ids.add(buttonDeviceId);
    }

    for (const alert of alerts) {
      if (alert.deviceId) {
        ids.add(alert.deviceId);
      }
    }

    return [...ids].sort();
  }, [
    user?.uid,
    ownedCameras,
    camera1DeviceId,
    camera2DeviceId,
    buttonDeviceId,
    alerts,
  ]);

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

    let cancelled = false;
    let syncing = false;
    // Ably cannot replay an unlimited offline gap. Reconcile saved alerts after
    // attachment/reconnection, including alerts created during initial discovery.
    const syncSavedAlerts = async () => {
      if (cancelled || syncing) return;
      syncing = true;
      try {
        const token = await user.getIdToken();
        const page = await getSavedAlerts(token, { limit: 50 });
        if (!cancelled) mergeAlerts(page.alerts);
      } catch (error) {
        console.error("[Alerts] Failed to reconcile realtime alerts:", error);
      } finally {
        syncing = false;
      }
    };
    client.connection.on((change) => {
      console.log("[Ably] Connection:", change.current, change.reason?.message);
    });

    const handleAlert = (message: Message) => {
      if (cancelled) return;
      const fields = parseAlertFields(message.data);

      if (fields) {
        upsertAlert(fields);
      } else {
        console.warn("[Ably] Ignored invalid alert payload");
      }
    };

    const channels = ids.map((deviceId) => {
      const channelName = buildAlertsChannelName(user.uid, deviceId);

      const channel = client.channels.get(channelName);

      channel.on("attached", () => {
        console.log("[Ably] Subscribed:", channelName);
        void syncSavedAlerts();
      });
      channel.on("failed", (change) => {
        console.error("[Ably] Channel failed:", channelName, change.reason?.message);
      });

      channel.subscribe(ALERT_CREATED_EVENT, handleAlert).catch((error) => {
        console.error("[Ably] Failed to subscribe:", channelName, error);
      });

      return channel;
    });

    return () => {
      cancelled = true;
      for (const channel of channels) {
        channel.unsubscribe(ALERT_CREATED_EVENT, handleAlert);
        channel.off();
      }

      client.connection.off();
      client.close();
    };
  }, [user, deviceIdsKey, upsertAlert, mergeAlerts]);
}
