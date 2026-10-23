import type { TokenRequest } from "ably";
import type { User } from "firebase/auth";

import { apiClient } from "@/shared/api";

/**
 * Standard success envelope wrapped around every backend response.
 */
interface StandardEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

function unwrap<T>(envelope: StandardEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.message || "The request failed.");
  return envelope.data;
}

/**
 * Identity from GET /auth/me. Older name fields remain optional so existing
 * profile displays can still read accounts created before this contract.
 */
export interface CurrentUser {
  uid?: string;
  emailVerified?: boolean;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  // Google's profile photo, from the Firebase token's "picture" claim.
  picture?: string | null;
}

export async function registerAccount(input: { username: string; email: string; password: string }) {
  const response = await apiClient.post<StandardEnvelope<{ email: string }>>("/auth/register", input);
  return unwrap(response);
}

export async function loginAccount(identifier: string, password: string) {
  const response = await apiClient.post<StandardEnvelope<{ uid: string; email: string }>>(
    "/auth/login",
    { identifier, password },
  );
  return unwrap(response);
}

export async function verifyRegisteredAccount(firebaseToken: string) {
  const response = await apiClient.post<StandardEnvelope<{ uid: string; email: string }>>(
    "/auth/register/verify",
    undefined,
    firebaseToken,
  );
  return unwrap(response);
}

export async function requestPasswordReset(email: string) {
  const response = await apiClient.post<StandardEnvelope<Record<string, unknown>>>("/auth/forgot-password", { email });
  return unwrap(response);
}

const profileChecks = new Map<string, Promise<boolean>>();

/** Share the verification request between login and the auth-state listener. */
export function ensureEmailPasswordProfile(user: User): Promise<boolean> {
  const existing = profileChecks.get(user.uid);
  if (existing) return existing;
  const pending = (async () => {
    const token = await user.getIdToken(true);
    const hasProfile = await checkIsOldUser(token);
    if (!hasProfile) await verifyRegisteredAccount(token);
    return true;
  })();
  profileChecks.set(user.uid, pending);
  void pending.finally(() => profileChecks.delete(user.uid)).catch(() => undefined);
  return pending;
}

/**
 * Fetch the signed-in user's profile. GET /auth/me — the base URL already
 * includes /v1, so we call "/auth/me" without duplicating it.
 */
export const getCurrentUser = async (
  firebaseToken: string,
): Promise<CurrentUser> => {
  const envelope = await apiClient.get<StandardEnvelope<CurrentUser>>(
    "/auth/me",
    firebaseToken,
  );

  return unwrap(envelope);
};

export const checkIsOldUser = async (
  firebaseToken: string,
): Promise<boolean> => {
  const data = await apiClient.get<StandardEnvelope<boolean>>("/auth/is-old-user", firebaseToken);

  // Reject an unexpected payload instead of interpreting it as a new user.
  if (typeof data?.data !== "boolean") {
    throw new Error(
      "The server returned an invalid user status. Please try again.",
    );
  }

  return unwrap(data);
};

export const getAblyToken = async (
  firebaseToken: string,
): Promise<TokenRequest> => {
  const data = await apiClient.get<StandardEnvelope<TokenRequest>>("/auth/ably-token", firebaseToken);
  return unwrap(data);
};
