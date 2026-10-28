import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";

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

// Legacy backend sessions provide an expiry. Firebase validates expiry itself.
export type VerifiedResetSession = {
  resetToken: string;
  expiresAt?: number;
  provider?: "firebase";
};

function linkError(error: unknown): RecoveryError {
  const code = error && typeof error === "object" && "code" in error ? error.code : "";
  if (code === "auth/network-request-failed" || error instanceof TypeError) return new RecoveryError("network", "Connection lost. Try again.");
  if (code === "auth/expired-action-code") return new RecoveryError("expired-session", "Reset link expired. Request a new link.");
  if (code === "auth/invalid-action-code" || code === "auth/user-not-found" || code === "auth/user-disabled") {
    return new RecoveryError("invalid-session", "Invalid reset link. Request a new link.");
  }
  if (code === "auth/weak-password" || code === "auth/password-does-not-meet-requirements") return new RecoveryError("request-failed", "Choose a stronger password.");
  return new RecoveryError("request-failed", "Couldn't verify the reset link. Try again.");
}

/** Verify the Firebase action before displaying any editable password fields. */
export async function verifyPasswordResetLink(code: string, expectedEmail?: string | null) {
  try {
    if (!code.trim()) throw new RecoveryError("invalid-session", "Invalid reset link.");
    const email = await verifyPasswordResetCode(auth, code);
    if (expectedEmail && expectedEmail.trim().toLowerCase() !== email.toLowerCase()) {
      throw new RecoveryError("invalid-session", "This link is for a different email.");
    }
    // Firebase does not return a deadline. It validates expiry again on save.
    return { email, session: { resetToken: code, provider: "firebase" as const } };
  } catch (error) {
    if (error instanceof RecoveryError) throw error;
    throw linkError(error);
  }
}

const unavailable = () =>
  new RecoveryError(
    "unavailable",
    "Password recovery unavailable. No code sent.",
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
  resetToken: string,
  newPassword: string,
): Promise<{ success: true }> {
  try {
    await verifyPasswordResetCode(auth, resetToken);
    await confirmPasswordReset(auth, resetToken, newPassword);
    return { success: true };
  } catch (error) {
    throw linkError(error);
  }
}

export function recoveryMessage(error: unknown): string {
  if (error instanceof RecoveryError) {
    switch (error.code) {
      case "invalid-code":
        return "Incorrect code. Try again.";
      case "expired-code":
        return "Code expired. Request a new one.";
      case "invalid-session":
      case "expired-session":
        return "Reset link expired or invalid. Request a new link.";
      case "network":
        return "Connection lost. Check your internet.";
      default:
        return error.message;
    }
  }
  if (error instanceof TypeError) {
    return "Connection lost. Check your internet.";
  }
  return "Something went wrong. Try again.";
}
