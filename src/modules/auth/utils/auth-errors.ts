import { APIError } from "@/shared/api/errors";

function codeOf(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const code = "code" in error ? error.code : undefined;
  return typeof code === "string" ? code.toLowerCase() : "";
}

export function isUnverifiedAccount(error: unknown): boolean {
  if (!(error instanceof APIError)) return false;
  const code = codeOf(error.data);
  return code.includes("email_not_verified") || code.includes("unverified") ||
    /email.{0,20}not verified|verify your email/i.test(error.message);
}

export function authErrorMessage(error: unknown, action: "login" | "register" | "status"): string {
  const code = codeOf(error);
  if (code === "auth/network-request-failed" || error instanceof TypeError) {
    return "You're offline. Check your connection and try again.";
  }
  if (code === "auth/too-many-requests" || error instanceof APIError && error.status === 429) {
    return "Too many attempts. Please wait a while and try again.";
  }
  if (code === "auth/user-disabled" || error instanceof APIError && /disabled/i.test(error.message)) {
    return "This account is unavailable. Please contact support.";
  }
  if (isUnverifiedAccount(error)) {
    return "Your email isn't verified yet. Please check your inbox to complete verification.";
  }
  if (error instanceof Error && /verified, but your RideGuard profile could not be found|registration is no longer pending/i.test(error.message)) {
    return "Your email is verified, but account setup isn't complete. Please contact support.";
  }
  if (action === "login" && (code === "auth/invalid-credential" || code === "auth/wrong-password" ||
      error instanceof APIError && error.status === 401)) {
    return "Incorrect username, email, or password. Please try again.";
  }
  if (action === "register" && error instanceof APIError) {
    if (error.status === 409 || /already (exists|registered|taken)|duplicate/i.test(error.message)) {
      return "That username or email already has an account. Log in to continue; if the email isn't verified, you can resend its verification link.";
    }
    if (error.status === 400) return "Check your account details and try again.";
  }
  if (error instanceof APIError && error.status >= 500 || error instanceof APIError && error.status === 404) {
    return "We couldn't complete your request right now. Please try again.";
  }
  return action === "status"
    ? "We couldn't check your email status. Check your connection and try again."
    : action === "register"
      ? "We couldn't create your account. Please try again."
      : "We couldn't log you in. Please try again.";
}

export function registrationFieldErrors(error: unknown): Partial<Record<"username" | "email" | "password", string>> {
  if (!(error instanceof APIError) || !error.data || typeof error.data !== "object" || !("fields" in error.data)) return {};
  const fields = error.data.fields;
  if (!fields || typeof fields !== "object") return {};
  const result: Partial<Record<"username" | "email" | "password", string>> = {};
  for (const field of ["username", "email", "password"] as const) {
    if (field in fields) result[field] = field === "email" ? "Check your email address." :
      field === "username" ? "Check your username." : "Check your password.";
  }
  return result;
}
