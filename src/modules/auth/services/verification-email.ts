import { sendEmailVerification, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";

export type VerificationEmailStage = "sign-in" | "send";

export class VerificationEmailError extends Error {
  constructor(
    readonly stage: VerificationEmailStage,
    readonly code: string | null,
  ) {
    super(`Verification email ${stage} failed${code ? ` (${code})` : ""}.`);
    this.name = "VerificationEmailError";
  }
}

function firebaseErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  return typeof error.code === "string" ? error.code : null;
}

/** The backend creates the Firebase user; the app signs in only to request a link. */
export async function sendRegistrationVerification(
  email: string,
  password: string,
): Promise<"sent" | "already-verified"> {
  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new VerificationEmailError("sign-in", firebaseErrorCode(error));
  }

  try {
    return await sendVerificationForUser(credential.user);
  } finally {
    // Keep an unverified account out of the authenticated app session.
    await signOut(auth).catch(() => undefined);
  }
}

/** Reuse the existing Firebase link delivery for an already signed-in account. */
export async function sendVerificationForUser(user: User): Promise<"sent" | "already-verified"> {
  if (user.emailVerified) return "already-verified";
  try {
    await sendEmailVerification(user);
  } catch (error) {
    throw new VerificationEmailError("send", firebaseErrorCode(error));
  }
  return "sent";
}

export function verificationEmailMessage(error: unknown): string {
  const code = error instanceof VerificationEmailError ? error.code : firebaseErrorCode(error);
  if (code === "auth/too-many-requests") {
    return "Too many email requests. Wait a while before trying again.";
  }
  if (code === "auth/network-request-failed") {
    return "Could not reach Firebase. Check your connection and try again.";
  }
  if (!(error instanceof VerificationEmailError)) {
    return "Could not send a verification link. Check your connection and try again.";
  }
  if (error.stage === "sign-in") {
    return "We couldn't confirm your account to send a link. Check your password and try again.";
  }
  return "We couldn't send a verification link right now. Try again in a moment.";
}
