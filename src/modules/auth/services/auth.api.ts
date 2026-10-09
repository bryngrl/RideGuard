import type { TokenRequest } from "ably";

import { apiClient } from "@/shared/api";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://rideguard-api-gvanehe0gbdvf9bw.japaneast-01.azurewebsites.net/v1";

/**
 * Standard success envelope wrapped around every backend response.
 */
interface StandardEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Signed-in user's profile as returned by GET /auth/me. Field casing isn't
 * guaranteed, so both snake_case and camelCase variants are accepted and
 * unwrapped by `getMe`.
 */
export interface CurrentUser {
  first_name?: string | null;
  last_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
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

  return envelope.data;
};

export const checkIsOldUser = async (
  firebaseToken: string,
): Promise<boolean> => {
  const response = await fetch(`${API_BASE_URL}/auth/is-old-user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to check user status.");
  }

  // to handle server response that is not a booolean value.
  if (typeof data?.data !== "boolean") {
    throw new Error(
      "The server returned an invalid user status. Please try again.",
    );
  }

  return data.data;
};

export const getAblyToken = async (
  firebaseToken: string,
): Promise<TokenRequest> => {
  const response = await fetch(`${API_BASE_URL}/auth/ably-token`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch Ably token.");
  }

  return data.data;
};
