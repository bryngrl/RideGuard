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

export function unverifiedAccountEmail(error: unknown, identifier: string): string {
  if (!isUnverifiedAccount(error)) return "";
  const data = (error as APIError).data;
  const email = data && typeof data === "object" && "email" in data ? data.email : undefined;
  return typeof email === "string" && /^[^\s@]+@[^\s@]+$/.test(email.trim())
    ? email.trim().toLowerCase() : identifier.includes("@") ? identifier.trim().toLowerCase() : "";
}

export function authErrorMessage(error: unknown, action: "login" | "register" | "status"): string {
  const code = codeOf(error);
  if (error instanceof APIError && error.status === 408) {
    return "Request timed out. Check your connection and try again.";
  }
  if (code === "auth/network-request-failed" || error instanceof TypeError) {
    return "You're offline. Check your connection.";
  }
  if (code === "auth/too-many-requests" || error instanceof APIError && error.status === 429) {
    return "Too many attempts. Try again later.";
  }
  if (code === "auth/user-disabled" || error instanceof APIError && /disabled/i.test(error.message)) {
    return "Account unavailable. Contact support.";
  }
  if (isUnverifiedAccount(error)) {
    return "Email not verified. Check your inbox.";
  }
  if (error instanceof Error && /verified, but your RideGuard profile could not be found|registration is no longer pending/i.test(error.message)) {
    return "Account setup incomplete. Contact support.";
  }
  if (action === "login" && (code === "auth/invalid-credential" || code === "auth/wrong-password" ||
      error instanceof APIError && error.status === 401)) {
    return "Incorrect username, email, or password.";
  }
  if (action === "register" && error instanceof APIError) {
    if (error.status === 409 || /already (exists|registered|taken)|duplicate/i.test(error.message)) {
      return "The username or email already has an account.";
    }
    if (error.status === 400) return "Check your account details and try again.";
  }
  if (error instanceof APIError && error.status >= 500) {
    return "Service unavailable. Try again shortly.";
  }
  if (error instanceof APIError && error.status === 404) {
    return "Request failed. Try again.";
  }
  return action === "status"
    ? "Couldn't check verification. Try again."
    : action === "register"
      ? "Couldn't create account. Try again."
      : "Couldn't log in. Try again.";
}

export function registrationFieldErrors(error: unknown): Partial<Record<"username" | "email" | "password", string>> {
  if (!(error instanceof APIError)) return {};
  const fields = error.data && typeof error.data === "object" && "fields" in error.data
    ? error.data.fields : null;
  const result: Partial<Record<"username" | "email" | "password", string>> = {};
  for (const field of ["username", "email", "password"] as const) {
    // Nest's validation filter returns joined message strings, not a fields map.
    const validationError = error.status === 400 && new RegExp(`(?:^|,\\s*)${field} must\\b`, "i").test(error.message);
    const fieldError = fields && typeof fields === "object" && field in fields && fields[field as keyof typeof fields];
    if (validationError || fieldError) result[field] = field === "email" ? "Use a valid Gmail address." :
      field === "username" ? "Use 3–24 letters, numbers, periods, or underscores." : "Use 8+ characters with a letter and number.";
  }
  return result;
}
