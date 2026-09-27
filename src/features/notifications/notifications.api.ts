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

// Removes this installation's push registration on the backend. The
// authenticated apiClient attaches the current user's Firebase ID token, and
// the backend only deletes a registration the caller owns.
export async function unregisterPushNotification(
  installationId: string,
): Promise<void> {
  const normalizedId = installationId.trim();

  if (!normalizedId) {
    throw new Error("Installation ID is required.");
  }

  try {
    await apiClient.delete(
      `/notifications/registrations/${encodeURIComponent(normalizedId)}`,
    );
  } catch (error) {
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
      throw new Error(
        error.response?.data.message ??
          "Unable to unregister push notifications.",
      );
    }

    throw error;
  }
}
