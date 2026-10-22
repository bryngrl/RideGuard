export type AlertSeverity = "clear" | "threat";
export type AlertDetectionType = "none" | "weapon" | "violence" | "both";

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
  imageUrl?: string | string[] | null;
  // The violence-clip URL. Absent/null means no clip, including old alerts
  // and weapon-only alerts (media never implies a violence threat).
  videoUrl?: string | null;
  timeStamp: string;
  // Backend alert-creation time; the auto-archive deadline is measured from
  // this, not the event timeStamp. Legacy payloads fall back to timeStamp.
  createdAt: string;
  isFalseAlarm: boolean;
  isSeen: boolean;
  // Auto-archive state. isArchived defaults false for legacy payloads.
  isArchived: boolean;
  // When the backend archived it (ISO), else null.
  archivedAt: string | null;
  // Server-derived deadline (createdAt + preference), or null when archiving is
  // off. Authoritative for an active alert; null once archived.
  archiveAt: string | null;
}
