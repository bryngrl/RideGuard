import type { TokenRequest } from "ably";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://rideguard-api-gvanehe0gbdvf9bw.japaneast-01.azurewebsites.net/v1";

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
