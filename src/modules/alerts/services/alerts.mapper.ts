import type { AlertFields, AlertItem } from "../types/alert.types";

/**
 * Normalize a timestamp coming from either the realtime channel (a JSON date
 * string) or a saved backend record (may serialize as a Firestore timestamp
 * object) into an ISO string. Returns "" when it can't be understood.
 */
function normalizeTimeStamp(input: unknown): string {
  if (typeof input === "string") return input;
  if (typeof input === "number") {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    const seconds =
      typeof obj._seconds === "number"
        ? obj._seconds
        : typeof obj.seconds === "number"
          ? obj.seconds
          : null;
    if (seconds !== null) {
      const date = new Date(seconds * 1000);
      return Number.isNaN(date.getTime()) ? "" : date.toISOString();
    }
  }
  return "";
}

function normalizeImageUrl(input: unknown): string | null {
  return typeof input === "string" && input.length > 0 ? input : null;
}

/**
 * Validate an incoming alert payload (realtime message data or saved record)
 * and coerce it into AlertFields. Requires a usable alertId; returns null when
 * the payload is unusable so callers can safely skip it.
 */
export function parseAlertFields(input: unknown): AlertFields | null {
  if (!input || typeof input !== "object") return null;

  const data = input as Record<string, unknown>;

  const alertId =
    typeof data.alertId === "string" ? data.alertId.trim() : "";
  if (!alertId) return null;

  if (typeof data.deviceId !== "string" || data.deviceId.length === 0) {
    return null;
  }
  if (typeof data.message !== "string") return null;

  return {
    alertId,
    deviceId: data.deviceId,
    message: data.message,
    imageUrl: normalizeImageUrl(data.imageUrl),
    timeStamp: normalizeTimeStamp(data.timeStamp),
    isFalseAlarm: data.isFalseAlarm === true,
    isSeen: data.isSeen === true,
  };
}

/**
 * Parse the ISO timestamp into epoch millis for sorting. Invalid/empty → 0.
 */
export function alertTimeValue(timeStamp: string): number {
  if (!timeStamp) return 0;
  const value = new Date(timeStamp).getTime();
  return Number.isNaN(value) ? 0 : value;
}

/**
 * Human-friendly date + time label, e.g. "Sep 28, 10:30 AM".
 * Returns "" for invalid input.
 */
export function formatAlertTime(timeStamp: string): string {
  if (!timeStamp) return "";
  const date = new Date(timeStamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Map a backend payload to the UI item. The title and severity are derived
 * from `isFalseAlarm` only — never from the original message text.
 * Returns null when the payload lacks a usable alertId.
 */
export function mapAlertFieldsToItem(fields: AlertFields): AlertItem | null {
  const alertId =
    typeof fields.alertId === "string" ? fields.alertId.trim() : "";
  if (!alertId) return null;

  const isFalseAlarm = fields.isFalseAlarm === true;

  return {
    alertId,
    title: isFalseAlarm ? "All clear" : "Threat detected",
    severity: isFalseAlarm ? "clear" : "threat",
    time: formatAlertTime(fields.timeStamp),
    read: fields.isSeen === true,
  };
}
