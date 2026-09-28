import { apiClient } from "@/shared/api";

export interface RegisterPushBody {
  installationId: string;
  registrationId: string;
  platform: string;
  deviceName?: string;
}

/**
 * Register this device's push token so it starts receiving alerts.
 * The base URL already includes /v1, so we call "/notifications/..." directly.
 * Both endpoints return 204 No Content.
 */
export async function registerPushNotification(
  body: RegisterPushBody,
  firebaseToken: string,
): Promise<void> {
  await apiClient.post<void>("/notifications/register", body, firebaseToken);
}

/**
 * Remove this device's push registration (called on logout) so it stops
 * receiving alerts.
 */
export async function unregisterPushNotification(
  installationId: string,
  firebaseToken: string,
): Promise<void> {
  await apiClient.delete<void>(
    `/notifications/registrations/${encodeURIComponent(installationId)}`,
    firebaseToken,
  );
}
