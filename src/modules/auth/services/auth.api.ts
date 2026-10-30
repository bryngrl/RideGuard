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
  const response = await apiClient.post<StandardEnvelope<{ email: string }>>("/auth/register", {
    ...input,
    username: input.username.trim().toLowerCase(),
    email: input.email.trim().toLowerCase(),
  });
  return unwrap(response);
}

export async function loginAccount(identifier: string, password: string) {
  const response = await apiClient.post<StandardEnvelope<{ uid: string; email: string }>>(
    "/auth/login",
    { identifier, password },
  );
  return unwrap(response);
}

export async function requestPasswordReset(email: string) {
  const response = await apiClient.post<StandardEnvelope<Record<string, unknown>>>("/auth/forgot-password", { email });
  return unwrap(response);
}

const profileChecks = new Map<string, Promise<boolean>>();

async function hasRegistrationProfile(token: string): Promise<boolean> {
  const response = await apiClient.get<StandardEnvelope<Record<string, unknown> | null>>("/profile/me", token);
  const profile = unwrap(response);
  return profile !== null && typeof profile === "object";
}

/** Share profile validation between login and the auth-state listener. */
export function ensureEmailPasswordProfile(user: User): Promise<boolean> {
  const existing = profileChecks.get(user.uid);
  if (existing) return existing;
  const pending = (async () => {
    // Verification callers refresh the token after reload. Firebase refreshes
    // expired tokens itself; repeating forced refreshes adds network round trips.
    const token = await user.getIdToken();
    const hasProfile = await checkIsOldUser(token);
    if (hasProfile) return true;
    if (await hasRegistrationProfile(token)) return false;
    // The code-verification endpoint now creates the identity stub atomically
    // from the caller's perspective. Never call the removed link-verify route
    // or manufacture a profile when the backend cannot confirm one.
    throw new Error(
      "Your email is verified, but your RideGuard profile could not be found. Please contact support to finish account setup.",
    );
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

const userStatusRequests = new Map<string, Promise<boolean>>();

export const checkIsOldUser = (
  firebaseToken: string,
): Promise<boolean> => {
  const existing = userStatusRequests.get(firebaseToken);
  if (existing) return existing;
  const pending = fetchUserStatus(firebaseToken);
  userStatusRequests.set(firebaseToken, pending);
  void pending.finally(() => userStatusRequests.delete(firebaseToken)).catch(() => undefined);
  return pending;
};

async function fetchUserStatus(firebaseToken: string): Promise<boolean> {
  const data = await apiClient.get<StandardEnvelope<boolean>>("/auth/is-old-user", firebaseToken);

  // Reject an unexpected payload instead of interpreting it as a new user.
  if (typeof data?.data !== "boolean") {
    throw new Error(
      "The server returned an invalid user status. Please try again.",
    );
  }

  return unwrap(data);
}

export const getAblyToken = async (
  firebaseToken: string,
): Promise<TokenRequest> => {
  const data = await apiClient.get<StandardEnvelope<TokenRequest>>("/auth/ably-token", firebaseToken);
  return unwrap(data);
};
