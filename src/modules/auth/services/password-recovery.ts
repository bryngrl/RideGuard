export type RecoveryErrorCode =
  | "unavailable"
  | "network"
  | "invalid-code"
  | "expired-code"
  | "invalid-session"
  | "expired-session"
  | "request-failed";

export class RecoveryError extends Error {
  constructor(
    public readonly code: RecoveryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RecoveryError";
  }
}

export type CodeDelivery = {
  expiresAt: number;
  resendAt: number;
};

// The verification endpoint must provide its actual token expiry (Unix ms).
export type VerifiedResetSession = {
  resetToken: string;
  expiresAt: number;
};

const unavailable = () =>
  new RecoveryError(
    "unavailable",
    "Password recovery is not connected yet. No code was sent.",
  );

// Connect these functions to the recovery endpoints when the backend is ready.
// Until then, calls fail explicitly and never imply that a code was delivered.
export async function requestResetCode(
  _email: string,
): Promise<CodeDelivery> {
  throw unavailable();
}

export async function resendResetCode(
  _email: string,
): Promise<CodeDelivery> {
  throw unavailable();
}

export async function verifyResetCode(
  _email: string,
  _code: string,
): Promise<VerifiedResetSession> {
  throw unavailable();
}

export async function changeResetPassword(
  _resetToken: string,
  _newPassword: string,
): Promise<{ success: true }> {
  throw new RecoveryError(
    "unavailable",
    "Password reset is not connected yet. Your password has not been changed.",
  );
}

export function recoveryMessage(error: unknown): string {
  if (error instanceof RecoveryError) {
    switch (error.code) {
      case "invalid-code":
        return "That code is incorrect. Check it and try again.";
      case "expired-code":
        return "That code has expired. Request a new code.";
      case "invalid-session":
      case "expired-session":
        return "Your reset session has expired or is invalid. Request a new code to continue.";
      case "network":
        return "Connection lost. Check your internet and try again.";
      default:
        return error.message;
    }
  }
  if (error instanceof TypeError) {
    return "Connection lost. Check your internet and try again.";
  }
  return "Something went wrong. Please try again.";
}
