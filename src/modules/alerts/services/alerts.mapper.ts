import type {
  AlertDetectionType,
  AlertFields,
  AlertItem,
} from "../types/alert.types";

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

function normalizeImageUrl(input: unknown): string | string[] | null {
  if (typeof input === "string" && input.length > 0) return input;
  if (Array.isArray(input)) {
    const urls = input.filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );
    return urls.length > 0 ? urls : null;
  }
  return null;
}

function normalizeVideoUrl(input: unknown): string | null {
  return typeof input === "string" && input.length > 0 ? input : null;
}

export function getSnapshotUris(
  imageUrl: string | string[] | null | undefined,
): string[] {
  const uris = typeof imageUrl === "string" ? [imageUrl] : (imageUrl ?? []);
  return uris.filter((uri) => typeof uri === "string" && uri.trim() !== "");
}

/**
 * Validate an incoming alert payload (realtime message data or saved record)
 * and coerce it into AlertFields. Requires a usable alertId; returns null when
 * the payload is unusable so callers can safely skip it.
 */
export function parseAlertFields(input: unknown): AlertFields | null {
  if (!input || typeof input !== "object") return null;

  const data = input as Record<string, unknown>;

  const alertId = typeof data.alertId === "string" ? data.alertId.trim() : "";
  if (!alertId) return null;

  if (typeof data.deviceId !== "string" || data.deviceId.length === 0) {
    return null;
  }
  if (typeof data.message !== "string") return null;

  const timeStamp = normalizeTimeStamp(data.timeStamp);
  // Legacy payloads carry no createdAt; fall back to the event timeStamp.
  const createdAt = normalizeTimeStamp(data.createdAt) || timeStamp;

  return {
    alertId,
    deviceId: data.deviceId,
    message: data.message,
    imageUrl: normalizeImageUrl(data.imageUrl),
    videoUrl: normalizeVideoUrl(data.videoUrl),
    timeStamp,
    createdAt,
    isFalseAlarm: data.isFalseAlarm === true,
    isSeen: data.isSeen === true,
    isArchived: data.isArchived === true,
    archivedAt: normalizeTimeStamp(data.archivedAt) || null,
    archiveAt: normalizeTimeStamp(data.archiveAt) || null,
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
 * Time-only label, e.g. "9:05 am". Returns "" for invalid input.
 */
export function formatClockTime(timeStamp: string): string {
  if (!timeStamp) return "";
  const date = new Date(timeStamp);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    .toLowerCase();
}

/** Use device-local time for both endpoints; never infer an end from createdAt. */
export function formatDetectionTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  fallbackTime: string,
): string {
  const parse = (value: string | null | undefined) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const start = parse(startTime) ?? parse(fallbackTime);
  if (!start) return "Time unavailable";
  const clock = (date: Date) => date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const end = parse(endTime);
  if (!end || end.getTime() < start.getTime()) return clock(start);

  const startDay = start.toLocaleDateString("en-CA");
  const endDay = end.toLocaleDateString("en-CA");
  const endLabel = startDay === endDay
    ? clock(end)
    : `${clock(end)} (${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
  return `${clock(start)} - ${endLabel}`;
}

/**
 * Relative day label: "Today", "Yesterday", or a date like "Sep 28".
 * Returns "" for invalid input.
 */
export function formatRelativeDay(timeStamp: string): string {
  if (!timeStamp) return "";
  const date = new Date(timeStamp);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const dayInMs = 24 * 60 * 60 * 1000;
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / dayInMs,
  );

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Concise human duration, e.g. "2 days", "5 hours", "12 minutes" (min 1). */
function formatDuration(ms: number): string {
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const minutes = Math.max(1, Math.floor(ms / 60_000));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/**
 * Detail-screen archive status line. Prefers the server-derived `archiveAt`;
 * for a fresh realtime alert that lacks it, falls back to createdAt plus the
 * loaded preference for a tentative countdown. The phone clock never changes
 * persisted archive status — this is display only.
 */
export function getArchiveStatusLabel(
  alert: Pick<
    AlertFields,
    "isArchived" | "archivedAt" | "archiveAt" | "createdAt"
  >,
  autoArchiveHours: number | null,
  now: number = Date.now(),
): string {
  if (alert.isArchived) {
    const when = alert.archivedAt ? formatRelativeDay(alert.archivedAt) : "";
    return when ? `Archived ${when}` : "Archived";
  }

  let deadline = alert.archiveAt ? new Date(alert.archiveAt).getTime() : NaN;
  if (Number.isNaN(deadline) && autoArchiveHours != null) {
    const created = new Date(alert.createdAt).getTime();
    if (!Number.isNaN(created)) {
      deadline = created + autoArchiveHours * 3_600_000;
    }
  }

  if (Number.isNaN(deadline)) return "Auto archive is off";

  const remaining = deadline - now;
  if (remaining <= 0) return "Archiving soon";
  return `Archives in ${formatDuration(remaining)}`;
}

export function getAlertDetectionType(message: string): AlertDetectionType {
  const title = message.trim().toLowerCase().replace(/[_-]+/g, " ");

  if (
    title.includes("all clear") ||
    title.includes("no detection") ||
    title.includes("nothing detected")
  ) {
    return "none";
  }

  const hasViolence =
    title.includes("violence") && !title.includes("no violence");
  const hasWeapon = title.includes("weapon") && !title.includes("no weapon");

  if (hasViolence && hasWeapon) {
    return "both";
  }
  if (hasViolence) return "violence";
  if (hasWeapon) return "weapon";
  return "none";
}

/**
 * Map a backend payload to the UI item. The displayed title remains the
 * original backend message; detection type and severity are derived from it.
 * Returns null when the payload lacks a usable alertId.
 */
export function mapAlertFieldsToItem(
  fields: AlertFields,
  presentation?: { startTime?: string; endTime?: string | null; manual?: boolean; pending?: boolean },
): AlertItem | null {
  const alertId =
    typeof fields.alertId === "string" ? fields.alertId.trim() : "";

  if (!alertId) return null;

  const detectionType = getAlertDetectionType(fields.message);

  return {
    alertId,
    title: fields.message,
    severity: detectionType === "none" ? "clear" : "threat",
    time: formatDetectionTimeRange(presentation?.startTime, presentation?.endTime, fields.timeStamp),
    manual: presentation?.manual === true,
    pending: presentation?.pending === true,
    read: fields.isSeen === true,
    subLabel: fields.isFalseAlarm ? "Marked as false alarm" : undefined,
  };
}
