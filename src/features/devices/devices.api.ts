import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/types";
import axios from "axios";

export async function claimDevice(deviceId: string): Promise<void> {
  const trimmedId = deviceId.trim();

  if (!trimmedId) {
    throw new Error("Device ID is required.");
  }

  try {
    await apiClient.patch<ApiResponse<unknown>>(
      `/devices/claim-device/${encodeURIComponent(trimmedId)}`,
    );
  } catch (error) {
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
      throw new Error(
        error.response?.data.message ?? "Unable to connect to the server.",
      );
    }

    throw error;
  }
}
