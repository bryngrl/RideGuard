import { apiClient } from "@/shared/api";
import { isSosRecord, type SosRecord } from "@/modules/sos/types";

/** Read-only alert association; never start, retry or stop an emergency here. */
export async function getAlertSos(token: string, alertId: string, signal?: AbortSignal): Promise<SosRecord | null> {
  if (!alertId.trim()) throw new Error("An alert is required.");
  const result = await apiClient.request<{ success: boolean; data: unknown }>(`/alerts/${encodeURIComponent(alertId)}/sos`, {
    method: "GET", token, signal,
  });
  if (result?.success !== true || !("data" in result)) throw new Error("Response status was not confirmed.");
  if (result.data === null) return null;
  if (!isSosRecord(result.data) || result.data.alertId !== alertId) throw new Error("Invalid response status for this alert.");
  return result.data;
}
