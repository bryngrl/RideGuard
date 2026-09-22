export const ALERT_EVENT_NAME = "alert.created";

export function alertsChannelForDevice(
  userId: string,
  deviceId: string,
): string {
  return `rideguard:alerts:user:${encodeURIComponent(userId)}:device:${encodeURIComponent(deviceId)}`;
}

export type AlertEvent = {
  alertId?: string;
  deviceId: string;
  message: string;
  imageUrl?: string | null;
  timeStamp: string; // ISO string; wrap with new Date() to use
  isFalseAlarm: boolean;
  isSeen: boolean;
};
