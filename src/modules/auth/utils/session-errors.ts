import { APIError } from "@/shared/api/errors";

/** A service outage is not evidence that the Firebase login has expired. */
export function isTemporarySessionFailure(error: unknown): boolean {
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  return error instanceof TypeError || code === "auth/network-request-failed" ||
    (error instanceof APIError && (error.status >= 500 || error.status === 429 || error.status === 408));
}
