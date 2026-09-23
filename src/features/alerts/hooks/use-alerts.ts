import type * as Ably from "ably";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ALERT_EVENT_NAME,
  alertsChannelForDevice,
  type AlertEvent,
} from "@/lib/ably/alerts";
import { ablyClient } from "@/lib/ably/client";
import { firebaseAuth } from "@/lib/firebase";

import { getAlerts } from "../alerts.api";
import { normalizeAlert } from "../normalize-alert";

export function alertKey(alert: AlertEvent): string {
  return alert.alertId ?? `${alert.deviceId}-${alert.timeStamp}`;
}

/**
 * Loads alert history from the REST API, then keeps the list live by
 * subscribing to the realtime channels for every device we've seen.
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setAlerts(await getAlerts());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to load alerts.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Prepend a live alert, ignoring anything we already have.
  const addAlert = useCallback((raw: unknown) => {
    const incoming = normalizeAlert(raw);
    setAlerts((prev) =>
      prev.some((existing) => alertKey(existing) === alertKey(incoming))
        ? prev
        : [incoming, ...prev],
    );
  }, []);

  const userId = firebaseAuth.currentUser?.uid ?? null;

  // The backend publishes to per-device channels and Ably can't subscribe to a
  // wildcard, so we watch the device channels we already know about from
  // history. TODO: replace with a dedicated "my devices" endpoint so we also
  // catch a device's very first alert.
  const deviceIds = useMemo(
    () =>
      Array.from(
        new Set(alerts.map((alert) => alert.deviceId).filter(Boolean)),
      ),
    [alerts],
  );
  const deviceIdsKey = deviceIds.slice().sort().join(",");

  useEffect(() => {
    if (!userId || deviceIds.length === 0) {
      return;
    }

    ablyClient.connect();

    const subscriptions = deviceIds.map((deviceId) => {
      const channelName = alertsChannelForDevice(userId, deviceId);
      const channel = ablyClient.channels.get(channelName);
      const handler = (message: Ably.Message) => addAlert(message.data);
      channel.subscribe(ALERT_EVENT_NAME, handler);
      return { channelName, channel, handler };
    });

    return () => {
      subscriptions.forEach(({ channelName, channel, handler }) => {
        channel.unsubscribe(ALERT_EVENT_NAME, handler);
        ablyClient.channels.release(channelName);
      });
    };
    // deviceIdsKey stands in for the deviceIds array's identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, deviceIdsKey, addAlert]);

  return { alerts, isLoading, error, refetch: load };
}
