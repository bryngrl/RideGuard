import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { getInstallationId } from "./installation-id";
import {
  registerPushNotification,
  unregisterPushNotification,
} from "./notifications.api";

// Must match the `defaultChannel` set for the expo-notifications plugin in app.json.
const ANDROID_ALERTS_CHANNEL_ID = "alerts";

// Android 13+ only shows the permission prompt once a channel exists, so the
// alerts channel must be created before we request permission.
async function ensureAndroidAlertsChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(ANDROID_ALERTS_CHANNEL_ID, {
    name: "Alerts",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Ask for push permission, read the device's native push token, and register it
 * with the backend. Returns true when a token was registered.
 *
 * We use the native device token (FCM on Android) because the backend delivers
 * through Firebase Cloud Messaging.
 */
export async function registerDeviceForPush(
  firebaseToken: string,
): Promise<boolean> {
  // Push notifications only work on a real device, not a simulator.
  if (!Device.isDevice) return false;

  await ensureAndroidAlertsChannel();

  // Ask for permission only if we don't already have it.
  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;

  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }

  if (!granted) return false;

  const devicePushToken = await Notifications.getDevicePushTokenAsync();
  const registrationId = devicePushToken.data;
  if (!registrationId) return false;

  const installationId = await getInstallationId();

  await registerPushNotification(
    {
      installationId,
      registrationId,
      platform: Platform.OS,
      deviceName: Device.deviceName ?? undefined,
    },
    firebaseToken,
  );

  return true;
}

/**
 * Save a rotated push token for the current install. FCM can hand out a new
 * token at any time; we re-register it under the same installationId so the
 * backend record is overwritten (same device, one row, fresh token) instead of
 * going stale. The caller supplies both the new token and the Firebase token.
 */
export async function saveRefreshedPushToken(
  registrationId: string,
  firebaseToken: string,
): Promise<void> {
  if (!registrationId.trim()) return;

  const installationId = await getInstallationId();

  await registerPushNotification(
    {
      installationId,
      registrationId,
      platform: Platform.OS,
      deviceName: Device.deviceName ?? undefined,
    },
    firebaseToken,
  );
}

/**
 * Remove this device's push registration on logout.
 */
export async function unregisterDeviceForPush(
  firebaseToken: string,
): Promise<void> {
  const installationId = await getInstallationId();
  await unregisterPushNotification(installationId, firebaseToken);
}
