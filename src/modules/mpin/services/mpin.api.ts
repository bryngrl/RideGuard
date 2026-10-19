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
  "account-disabled" | "email-unavailable" | "email-unverified" | "code-used" | "code-replaced" | "attempt-limit" | "resend-limit";

export class MpinError extends Error {
  constructor(public readonly code: MpinErrorCode, public readonly retryAt?: number) {
    super(code);
    this.name = "MpinError";
  }
}

export interface MpinBackend {
  /** Enable only when all endpoints and the server's unlock policy are integrated. */
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

const unavailable = async (): Promise<never> => { throw new MpinError("unavailable"); };

// No MPIN endpoints were present in this checkout. Never guess URLs, fabricate
// credentials, or treat local confirmation as server-side account protection.
export const mpinApi: MpinBackend = {
  enabled: false,
  status: unavailable, create: unavailable, unlock: unavailable,
  authorizeChange: unavailable, change: unavailable,
  requestChangeCode: unavailable, resendChangeCode: unavailable, verifyChangeCode: unavailable,
  requestRecovery: unavailable, resendRecovery: unavailable,
  verifyRecovery: unavailable, reset: unavailable,
};

export function mpinErrorMessage(error: unknown): string {
  if (error instanceof MpinError) {
    switch (error.code) {
      case "unavailable": return "MPIN is not connected yet. Your account's MPIN has not been changed.";
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
      case "code-used": return "That code has already been used. Start verification again.";
      case "code-replaced": return "That code was replaced. Enter the latest code from your email.";
      case "attempt-limit": return "Too many code attempts. Wait before requesting another code.";
      case "resend-limit": return "The code sending limit has been reached. Please try again later.";
    }
  }
  if (error instanceof TypeError) return "Connection lost. Check your internet and try again.";
  return "We couldn't complete that request. Please try again.";
}
