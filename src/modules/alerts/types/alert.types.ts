export type AlertSeverity = "clear" | "threat";

/**
 * UI shape rendered by the alert list/row.
 */
export interface AlertItem {
  alertId: string;
  title: string;
  time: string;
  severity: AlertSeverity;
  read: boolean;
  subLabel?: string;
  pending?: boolean;
}

/**
 * Raw backend payload for an alert. This is what Ably publishes on
 * "alert.created" and what GET /alerts returns (nested under `alertFields`).
 * The realtime `timeStamp` arrives as a JSON date string.
 */
export interface AlertFields {
  alertId?: string;
  deviceId: string;
  message: string;
  imageUrl?: string | null;
  timeStamp: string;
  isFalseAlarm: boolean;
  isSeen: boolean;
}
