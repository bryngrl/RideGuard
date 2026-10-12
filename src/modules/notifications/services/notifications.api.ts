import { apiClient } from "@/shared/api";

/**
 * Mirrors the backend `RegisterPushNotificationDto`. `registrationId` is the
 * native FCM device token (the backend hands it straight to FCM), and
 * `platform` is lowercased server-side so "android" / "ios" both work.
 */
export interface RegisterPushNotificationBody {
  installationId: string;
  registrationId: string;
  platform: string;
  deviceName?: string;
}

/**
 * Register (or refresh) this device's push token for the signed-in user.
 * POST /notifications/register — returns 204 No Content.
 */
export async function registerPushNotification(
  firebaseToken: string,
  body: RegisterPushNotificationBody,
): Promise<void> {
  await apiClient.post<null>("/notifications/register", body, firebaseToken);
}

/**
 * Remove this device's push registration so it stops receiving alerts.
 * Called on logout. DELETE /notifications/registrations/:installationId —
 * returns 204 No Content, and is idempotent server-side.
 */
export async function unregisterPushNotification(
  firebaseToken: string,
  installationId: string,
): Promise<void> {
  await apiClient.delete<null>(
    `/notifications/registrations/${encodeURIComponent(installationId)}`,
    firebaseToken,
  );
}
