import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/types";
import { IsOldUserResponse, TokenRequest } from "./auth.types";

export async function checkIsOldUser(): Promise<boolean> {
  return apiClient
    .get<ApiResponse<IsOldUserResponse>>("/auth/is-old-user")
    .then((response) => response.data.data.isOldUser)
    .catch((error) => {
      console.error("Error checking if user is old:", error);
      return false;
    });
}

export async function getAblyToken(): Promise<TokenRequest> {
  return apiClient
    .get<ApiResponse<TokenRequest>>("/auth/ably-token")
    .then((response) => response.data.data)
    .catch((error) => {
      console.error("Error fetching Ably token:", error);
      throw new Error("Failed to fetch Ably token");
    });
}
