import type * as Ably from "ably";
import { useEffect } from "react";

import {
  ALERT_EVENT_NAME,
  alertsChannelForDevice,
  type AlertEvent,
} from "@/lib/ably/alerts";
import { ablyClient } from "@/lib/ably/client";

export function useDeviceAlerts(
  userId: string,
  deviceId: string,
  onAlert: (alert: AlertEvent) => void,
) {
  useEffect(() => {
    if (!userId || !deviceId) return;

    const channelName = alertsChannelForDevice(userId, deviceId);
    const channel = ablyClient.channels.get(channelName);

    const handler = (message: Ably.Message) => {
      onAlert(message.data as AlertEvent);
    };

    channel.subscribe(ALERT_EVENT_NAME, handler);

    return () => {
      channel.unsubscribe(ALERT_EVENT_NAME, handler);
      ablyClient.channels.release(channelName);
    };
  }, [userId, deviceId, onAlert]);
}
