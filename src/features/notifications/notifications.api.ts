import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/types";
import axios from "axios";

export type RegisterPushNotificationInput = {
  installationId: string;
  registrationId: string;
  platform: "android";
  deviceName?: string;
};

// Sends the push registration to the backend. The authenticated apiClient
// attaches the Firebase bearer token, and the backend derives the user ID from
// it, so userId is never sent from the app.
export async function registerPushNotification(
  input: RegisterPushNotificationInput,
): Promise<void> {
  try {
    await apiClient.post<ApiResponse<unknown>>(
      "/notifications/register",
      input,
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
