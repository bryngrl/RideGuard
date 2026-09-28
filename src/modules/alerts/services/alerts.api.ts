import { apiClient } from "@/shared/api";

import type { AlertFields } from "../types/alert.types";
import { parseAlertFields } from "./alerts.mapper";

/**
 * Standard success envelope wrapped around every backend response.
 */
interface StandardEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface SavedAlertsData {
  data: unknown;
  nextCursor: string | null;
}

/**
 * Backend `Alert` instances serialize with their fields nested under
 * `alertFields`. Unwrap that (falling back to a flat payload defensively).
 */
function unwrapAlertFields(entry: unknown): unknown {
  if (entry && typeof entry === "object" && "alertFields" in entry) {
    return (entry as { alertFields: unknown }).alertFields;
  }
  return entry;
}

/**
 * Load saved alerts for the signed-in user. The base URL already includes /v1,
 * so we call "/alerts" without duplicating it.
 */
export async function getSavedAlerts(
  firebaseToken: string,
): Promise<AlertFields[]> {
  const envelope = await apiClient.get<StandardEnvelope<SavedAlertsData>>(
    "/alerts",
    firebaseToken,
  );

  const rawList = Array.isArray(envelope?.data?.data)
    ? envelope.data.data
    : [];

  return rawList
    .map((entry) => parseAlertFields(unwrapAlertFields(entry)))
    .filter((alert): alert is AlertFields => alert !== null);
}

/**
 * Mark an alert as a false alarm. Returns the updated backend payload.
 */
export async function markAlertAsFalseAlarm(
  alertId: string,
  firebaseToken: string,
): Promise<AlertFields> {
  const envelope = await apiClient.patch<StandardEnvelope<unknown>>(
    `/alerts/${encodeURIComponent(alertId)}/false-alarm`,
    { isFalseAlarm: true },
    firebaseToken,
  );

  const fields = parseAlertFields(unwrapAlertFields(envelope?.data));
  if (!fields) {
    throw new Error("The server returned an invalid alert.");
  }

  return fields;
}
