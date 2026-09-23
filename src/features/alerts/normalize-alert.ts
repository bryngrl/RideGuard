import type { AlertEvent } from "@/lib/ably/alerts";

// `timeStamp` is left as `unknown` because it can arrive as a Date, an ISO
// string, or a number depending on the source; we coerce it below.
type RawFields = Partial<Omit<AlertEvent, "timeStamp">> & { timeStamp?: unknown };

type RawAlert = RawFields & {
  // REST returns domain entities with fields nested under `alertFields`.
  alertFields?: RawFields;
};

/**
 * Flattens both shapes the backend can send us into one AlertEvent:
 *  - REST `GET /alerts` returns domain entities (fields under `alertFields`).
 *  - Realtime publishes the flat fields object directly.
 * Also coerces `timeStamp` (a Date on the server) to an ISO string, since it
 * arrives JSON-serialized either way.
 */
export function normalizeAlert(raw: unknown): AlertEvent {
  const source = ((raw as RawAlert)?.alertFields ?? raw ?? {}) as RawFields;

  const rawTime = source.timeStamp;
  const timeStamp =
    rawTime instanceof Date
      ? rawTime.toISOString()
      : typeof rawTime === "string" || typeof rawTime === "number"
        ? new Date(rawTime).toISOString()
        : new Date().toISOString();

  return {
    alertId: source.alertId,
    deviceId: source.deviceId ?? "",
    message: source.message ?? "",
    imageUrl: source.imageUrl ?? null,
    timeStamp,
    isFalseAlarm: source.isFalseAlarm ?? false,
    isSeen: source.isSeen ?? false,
  };
}
