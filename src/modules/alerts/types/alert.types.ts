export type AlertSeverity = "all_clear" | "possible_threat" | "metal_detected";

export type AlertStatus = "unread" | "read" | "false_alarm" | "pending";

export interface AlertTimelineEvent {
  time: string;
  description: string;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  timeRange: string;
  date: string; // used for grouping
  subLabel?: string;
  isRead: boolean;
  snapshotUris?: string[];
  autoDeleteLabel?: string;
  timeline: AlertTimelineEvent[];
  contactsNotified: boolean;
}
