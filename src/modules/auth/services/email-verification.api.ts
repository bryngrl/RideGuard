import { apiClient } from "@/shared/api";
import { APIError } from "@/shared/api/errors";

export type VerifiedEmailIdentity = { uid: string; email: string };
type Envelope<T> = { success: boolean; data: T };

export async function verifyEmailCode(email: string, code: string): Promise<VerifiedEmailIdentity> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@gmail\.com$/i.test(normalized) || !/^\d{6}$/.test(code)) throw new Error("Enter your email and six-digit code.");
  const result = await apiClient.post<Envelope<VerifiedEmailIdentity>>("/auth/verification/verify", { email: normalized, code });
  if (result?.success !== true || !result.data?.uid?.trim() || result.data.email?.toLowerCase() !== normalized) {
    throw new Error("Account verification was not confirmed. Try again.");
  }
  return result.data;
}

export async function resendEmailVerificationCode(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const result = await apiClient.post<Envelope<{ email: string }>>("/auth/verification/resend", { email: normalized });
  if (result?.success !== true || result.data?.email?.toLowerCase() !== normalized) throw new Error("Code delivery was not confirmed.");
}

export function emailVerificationError(error: unknown): string {
  if (error instanceof APIError) {
    if (error.status === 409) return "This email is already verified. Log in to continue.";
    if (error.status === 429) return "Too many attempts or requests. Wait a minute, then request a new code.";
    if (error.status === 400) return /expired/i.test(error.message) ? "This code has expired. Request a new code." : "Invalid verification code. Check the code or request a new one.";
    if (error.status === 408) return "Request timed out. Check your connection and try again.";
    if (error.status === 404) return "Email verification is unavailable on this server. Please try again later.";
    if (error.status >= 500) return "Verification service unavailable. Try again shortly.";
  }
  return "Couldn't verify your email. Check your connection and try again.";
}
