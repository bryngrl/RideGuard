import type { SosInput, SosRecord } from "../types";
import { isSosRecord } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://rideguard-api-gvanehe0gbdvf9bw.japaneast-01.azurewebsites.net/v1";

export class SosApiError extends Error {
  constructor(public status: number, public code?: string) { super("SOS request failed"); }
}

// SOS deliberately does not use the shared client's raw error-body logging.
// One HTTP attempt only; timeouts and malformed results need reconciliation.
export function createSosApi(getToken: (uid: string) => Promise<string>, baseUrl = BASE_URL, timeoutMs = 15000) {
  async function request<T>(uid: string, path: string, body?: SosInput | object, signal?: AbortSignal): Promise<T> {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort);
    const timer = setTimeout(abort, timeoutMs);
    try {
      const token = await Promise.race([getToken(uid), new Promise<never>((_resolve, reject) => {
        if (controller.signal.aborted) reject(new SosApiError(0));
        else controller.signal.addEventListener("abort", () => reject(new SosApiError(0)), { once: true });
      })]);
      if (signal?.aborted || controller.signal.aborted) throw new SosApiError(0);
      const response = await fetch(`${baseUrl}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: controller.signal,
      });
      const envelope = await response.json().catch(() => null) as { success?: boolean; code?: string; data?: T } | null;
      if (!response.ok) throw new SosApiError(response.status, envelope?.code);
      if (envelope?.success !== true || !("data" in envelope)) throw new SosApiError(0);
      return envelope.data as T;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  }
  async function record(uid: string, path: string, body?: SosInput | object, signal?: AbortSignal): Promise<SosRecord> {
    const result = await request<SosRecord>(uid, path, body, signal);
    if (!isSosRecord(result)) {
      throw new SosApiError(0);
    }
    return { ...result, alertId: result.alertId ?? null };
  }
  return {
    start: (uid: string, body: SosInput, signal?: AbortSignal) => record(uid, "/sos", body, signal),
    active: async (uid: string, signal?: AbortSignal): Promise<SosRecord | null> => {
      const result = await request<SosRecord | null>(uid, "/sos/active", undefined, signal);
      // Older backend envelopes converted null into an empty object.
      if (result && Object.keys(result).length === 0) return null;
      if (result !== null && !isSosRecord(result)) throw new SosApiError(0);
      return result ? { ...result, alertId: result.alertId ?? null } : null;
    },
    byRequest: async (uid: string, id: string, signal?: AbortSignal) => {
      try { return await record(uid, `/sos/by-request/${encodeURIComponent(id)}`, undefined, signal); }
      catch (error) { if (error instanceof SosApiError && error.status === 404) return null; throw error; }
    },
    get: (uid: string, id: string, signal?: AbortSignal) => record(uid, `/sos/${encodeURIComponent(id)}`, undefined, signal),
    stop: (uid: string, id: string, signal?: AbortSignal) => record(uid, `/sos/${encodeURIComponent(id)}/stop`, {}, signal),
  };
}

export type SosApi = ReturnType<typeof createSosApi>;

export function sosErrorMessage(error: unknown): string {
  if (error instanceof SosApiError) {
    if (error.code === "SOS_DISABLED") return "SOS unavailable. Contact someone directly.";
    if (error.code === "SOS_NO_CONTACTS") return "No available contacts. Check saved contacts.";
    if (error.status === 401 || error.status === 403) return "Sign in again to use SOS.";
    if (error.status === 404) return "The requested SOS or alert is unavailable.";
    if (error.status === 409) return "SOS request conflict. Check its status.";
    if (error.status === 400) return "SOS not accepted. Check its status first.";
  }
  return "SOS unreachable. Contact someone directly.";
}
