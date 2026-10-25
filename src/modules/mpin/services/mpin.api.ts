import { apiClient } from "@/shared/api";
import { APIError } from "@/shared/api/errors";

export type MpinMode = "setup" | "change" | "reset";
export type MpinStatus = {
  configured: boolean;
  requiresUnlock: boolean;
  locked?: boolean;
  lockedUntil?: number;
  remainingAttempts?: number;
  /** Server policy, not a client-selected inactivity timeout. */
  unlockExpiresAt?: number;
  emergencyAccessAllowed?: boolean;
  emergencyAlertIds?: string[];
  serverTime?: number;
};
export type MpinAuthorization = { token: string; expiresAt: number; serverTime?: number };
export type MpinStatusContext = { reason: "launch" | "resume" | "expiry"; inactiveForMs?: number };
export type MpinDelivery = { challengeId: string; expiresAt: number; resendAt: number; maskedDestination: string; serverTime?: number };
export type MpinErrorCode = "unavailable" | "incorrect-pin" | "invalid-code" | "expired-code" |
  "locked" | "expired-session" | "expired-authorization" | "already-configured" | "policy" | "network" | "timeout" | "failed" |
  "account-disabled" | "email-unavailable" | "email-unverified" | "email-delivery-unavailable" |
  "code-used" | "code-replaced" | "attempt-limit" | "resend-cooldown" | "resend-limit";

export class MpinError extends Error {
  constructor(public readonly code: MpinErrorCode, public readonly retryAt?: number, public remoteStatus?: MpinStatus) {
    super(code);
    this.name = "MpinError";
  }
}

export interface MpinBackend {
  /** The server is authoritative for setup, unlock, and all PIN changes. */
  enabled: boolean;
  /** Recovery and change remain unavailable until backend email links exist. */
  emailLinksEnabled: boolean;
  status: (authToken: string, signal: AbortSignal, context?: MpinStatusContext) => Promise<MpinStatus>;
  create: (authToken: string, pin: string, signal: AbortSignal) => Promise<{ success: true }>;
  unlock: (authToken: string, pin: string, signal: AbortSignal) => Promise<{ success: true }>;
  authorizeChange: (authToken: string, currentPin: string, signal: AbortSignal) => Promise<MpinAuthorization>;
  requestChangeCode: (authToken: string, currentPinProof: string, signal: AbortSignal) => Promise<MpinDelivery>;
  resendChangeCode: (authToken: string, challengeId: string, signal: AbortSignal) => Promise<MpinDelivery>;
  verifyChangeCode: (authToken: string, challengeId: string, code: string, signal: AbortSignal) => Promise<MpinAuthorization>;
  change: (authToken: string, authorization: string, pin: string, signal: AbortSignal) => Promise<{ success: true }>;
  requestRecovery: (authToken: string, signal: AbortSignal) => Promise<MpinDelivery>;
  resendRecovery: (authToken: string, challengeId: string, signal: AbortSignal) => Promise<MpinDelivery>;
  verifyRecovery: (authToken: string, challengeId: string, code: string, signal: AbortSignal) => Promise<MpinAuthorization>;
  reset: (authToken: string, authorization: string, pin: string, signal: AbortSignal) => Promise<{ success: true }>;
}

type Envelope<T> = { success: boolean; data: T; message?: string };
type Operation = "status" | "create" | "unlock" | "authorizeChange" | "requestChangeCode" |
  "resendChangeCode" | "verifyChangeCode" | "change" | "requestRecovery" |
  "resendRecovery" | "verifyRecovery" | "reset";

function retryAtFrom(error: APIError): number | undefined {
  const value = error.data;
  if (!value || typeof value !== "object") return undefined;
  const direct = "retryAt" in value ? value.retryAt : undefined;
  const nested = "data" in value && value.data && typeof value.data === "object" &&
    "retryAt" in value.data ? value.data.retryAt : undefined;
  const result = direct ?? nested;
  return typeof result === "number" && Number.isFinite(result) ? result : undefined;
}

function asMpinError(error: unknown, operation: Operation): MpinError {
  if (error instanceof MpinError) return error;
  if (error instanceof APIError) {
    const message = error.message.toLowerCase();
    if (error.status === 404 || error.status === 503 && !message.includes("email delivery")) return new MpinError("unavailable");
    if (error.status === 401) {
      if (message.includes("incorrect mpin")) return new MpinError("incorrect-pin");
      if (message.includes("invalid or expired code")) return new MpinError("invalid-code");
      if (message.includes("authorization")) return new MpinError("expired-authorization");
      return new MpinError("expired-session");
    }
    if (error.status === 403) return new MpinError(message.includes("email verification") ? "email-unverified" : "account-disabled");
    if (error.status === 409) return new MpinError("already-configured");
    if (error.status === 429) {
      const retryAt = retryAtFrom(error);
      if (message.includes("mpin is locked")) return new MpinError("locked", retryAt);
      if (message.includes("cannot be resent yet")) return new MpinError("resend-cooldown", retryAt);
      return new MpinError(operation.includes("resend") || message.includes("resent") ? "resend-limit" : "attempt-limit", retryAt);
    }
    if (error.status === 400 && message.includes("not configured")) return new MpinError("unavailable");
    if (error.status === 400 && message.includes("invalid challenge")) return new MpinError("expired-code");
    if (error.status === 400 && message.includes("pin")) return new MpinError("policy");
    if (error.status === 503 && message.includes("email delivery")) return new MpinError("email-delivery-unavailable");
    return new MpinError("failed");
  }
  if (error instanceof TypeError) return new MpinError("network");
  return new MpinError("failed");
}

async function request<T>(operation: Operation, path: string, token: string, signal: AbortSignal, body?: unknown): Promise<T> {
  try {
    const envelope = await apiClient.request<Envelope<T>>(path, {
      method: operation === "status" ? "GET" : "POST",
      token,
      signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (envelope?.success !== true || envelope.data === undefined || envelope.data === null) throw new MpinError("failed");
    return envelope.data;
  } catch (error) {
    throw asMpinError(error, operation);
  }
}

const base = "/mpin";
export const mpinApi: MpinBackend = {
  // Setup and unlock do not depend on email delivery.
  enabled: true,
  emailLinksEnabled: false,
  status: (token, signal, context) => {
    const params = new URLSearchParams();
    if (context) {
      params.set("reason", context.reason);
      // Nest's current DTO uses @IsNumber without query-string transformation.
      // The server ignores this optional value; never send a string that fails validation.
    }
    const query = params.toString();
    return request("status", `${base}/status${query ? `?${query}` : ""}`, token, signal);
  },
  create: (token, pin, signal) => request("create", `${base}/setup`, token, signal, { pin }),
  unlock: async (token, pin, signal) => {
    try {
      return await request("unlock", `${base}/unlock`, token, signal, { pin });
    } catch (reason) {
      const error = asMpinError(reason, "unlock");
      if (!signal?.aborted && (error.code === "incorrect-pin" || error.code === "locked")) {
        // The fifth incorrect attempt returns 401 while already starting lockout.
        // Refresh its authoritative deadline before enabling another entry.
        try { error.remoteStatus = await mpinApi.status(token, signal); } catch { /* Keep the original error. */ }
      }
      throw error;
    }
  },
  authorizeChange: (token, pin, signal) => request("authorizeChange", `${base}/change/authorize`, token, signal, { pin }),
  requestChangeCode: (token, authorization, signal) => request("requestChangeCode", `${base}/change/code`, token, signal, { authorization }),
  resendChangeCode: (token, challengeId, signal) => request("resendChangeCode", `${base}/change/code/resend`, token, signal, { challengeId }),
  verifyChangeCode: (token, challengeId, code, signal) => request("verifyChangeCode", `${base}/change/code/verify`, token, signal, { challengeId, code }),
  change: (token, authorization, pin, signal) => request("change", `${base}/change`, token, signal, { authorization, pin }),
  requestRecovery: (token, signal) => request("requestRecovery", `${base}/recovery/code`, token, signal),
  resendRecovery: (token, challengeId, signal) => request("resendRecovery", `${base}/recovery/code/resend`, token, signal, { challengeId }),
  verifyRecovery: (token, challengeId, code, signal) => request("verifyRecovery", `${base}/recovery/code/verify`, token, signal, { challengeId, code }),
  reset: (token, authorization, pin, signal) => request("reset", `${base}/recovery/reset`, token, signal, { authorization, pin }),
};

/** Establish setup and unlock separately; neither step may fabricate success. */
export async function setupAndUnlockMpin(token: string, pin: string, signal: AbortSignal): Promise<MpinStatus> {
  const saved = await mpinApi.create(token, pin, signal);
  if (saved?.success !== true) throw new MpinError("failed");
  if (signal.aborted) throw new MpinError("failed");
  const unlocked = await mpinApi.unlock(token, pin, signal);
  if (unlocked?.success !== true) throw new MpinError("failed");
  if (signal.aborted) throw new MpinError("failed");
  const status = await mpinApi.status(token, signal);
  if (status?.configured !== true || status.requiresUnlock !== false || status.locked || status.remainingAttempts === 0) {
    throw new MpinError("failed");
  }
  return status;
}

export function mpinErrorMessage(error: unknown): string {
  if (error instanceof MpinError) {
    switch (error.code) {
      case "unavailable": return "MPIN unavailable. Try again later.";
      case "incorrect-pin": return "Incorrect MPIN. Try again.";
      case "invalid-code": return "Incorrect code. Try again.";
      case "expired-code": return "Code expired. Request a new one.";
      case "locked": return "MPIN locked. Try later or reset it.";
      case "expired-session": return "Session expired. Log in again.";
      case "expired-authorization": return "Verification expired. Verify again.";
      case "already-configured": return "MPIN already exists. Check its status.";
      case "policy": return "MPIN not accepted. Choose another.";
      case "network": return "Connection lost. Check your internet.";
      case "timeout": return "Request timed out. Try again.";
      case "account-disabled": return "Account disabled. Contact support.";
      case "email-unavailable": return "Account email unavailable. Contact support.";
      case "email-unverified": return "Verify your email to update your MPIN.";
      case "email-delivery-unavailable": return "Email delivery unavailable. Try again later.";
      case "code-used": return "Code already used. Verify again.";
      case "code-replaced": return "Code replaced. Use the latest email.";
      case "attempt-limit": return "Too many code attempts. Try again later.";
      case "resend-cooldown": return "Wait before requesting another code.";
      case "resend-limit": return "Code limit reached. Try again later.";
    }
  }
  if (error instanceof TypeError) return "Connection lost. Check your internet.";
  return "Request failed. Try again.";
}
