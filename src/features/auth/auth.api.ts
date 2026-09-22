import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/types";
import { IsOldUserResponse } from "./auth.types";

export async function checkIsOldUser(): Promise<boolean> {
  return apiClient
    .get<ApiResponse<IsOldUserResponse>>("/auth/is-old-user")
    .then((response) => response.data.data.isOldUser)
    .catch((error) => {
      console.error("Error checking if user is old:", error);
      return false;
    });
}
