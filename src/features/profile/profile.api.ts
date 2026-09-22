import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/types";

import type { ProfilePayload } from "./profile.types";

export async function submitProfile(data: ProfilePayload): Promise<boolean> {
  const response = await apiClient.post<ApiResponse<unknown>>(
    "/profile/personal-info",
    data,
  );

  return response.data.success;
}
