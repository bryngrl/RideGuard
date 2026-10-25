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
  constructor(public readonly code: MpinErrorCode, public readonly retryAt?: number) {
    super(code);
    this.name = "MpinError";
  }
}

export interface MpinBackend {
  /** The server is authoritative for setup, unlock, and all PIN changes. */
  enabled: boolean;
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
  // The backend email sender for change/recovery is not deployed yet.
  // Keep the gate closed until those paths pass end-to-end testing.
  enabled: false,
  status: (token, signal, context) => {
    const params = new URLSearchParams();
    if (context) {
      params.set("reason", context.reason);
      if (context.inactiveForMs !== undefined) params.set("inactiveForMs", String(context.inactiveForMs));
    }
    const query = params.toString();
    return request("status", `${base}/status${query ? `?${query}` : ""}`, token, signal);
  },
  create: (token, pin, signal) => request("create", `${base}/setup`, token, signal, { pin }),
  unlock: (token, pin, signal) => request("unlock", `${base}/unlock`, token, signal, { pin }),
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

export function mpinErrorMessage(error: unknown): string {
  if (error instanceof MpinError) {
    switch (error.code) {
      case "unavailable": return "MPIN is temporarily unavailable. Please try again later.";
      case "incorrect-pin": return "Incorrect MPIN. Please try again.";
      case "invalid-code": return "That code is incorrect. Check it and try again.";
      case "expired-code": return "That code has expired. Request a new code.";
      case "locked": return "Too many incorrect attempts. Please try again later or reset your MPIN.";
      case "expired-session": return "Your session has expired. Please log in again.";
      case "expired-authorization": return "Your verification has expired. Verify your identity again to continue.";
      case "already-configured": return "An MPIN is already configured. Check your account's MPIN status to continue.";
      case "policy": return "This MPIN does not meet your account's security requirements. Choose another MPIN.";
      case "network": return "Connection lost. Check your internet and try again.";
      case "timeout": return "The request took too long. Check your connection and try again.";
      case "account-disabled": return "This account is disabled. Contact support for help.";
      case "email-unavailable": return "Your account needs an accessible registered email. Contact support to recover access.";
      case "email-unverified": return "Verify your account's registered email before using MPIN recovery or change.";
      case "email-delivery-unavailable": return "Verification email is temporarily unavailable. Please try again later.";
      case "code-used": return "That code has already been used. Start verification again.";
      case "code-replaced": return "That code was replaced. Enter the latest code from your email.";
      case "attempt-limit": return "Too many code attempts. Wait before requesting another code.";
      case "resend-cooldown": return "Please wait before requesting another code.";
      case "resend-limit": return "The code sending limit has been reached. Please try again later.";
    }
  }
  if (error instanceof TypeError) return "Connection lost. Check your internet and try again.";
  return "We couldn't complete that request. Please try again.";
}
