import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { firebaseAuth } from "@/lib/firebase";

import { getInstallationId } from "./installation-id";
import {
  registerPushNotification,
  type RegisterPushNotificationInput,
} from "./notifications.api";

const ANDROID_ALERTS_CHANNEL_ID = "alerts";
const ANDROID_PLATFORM = "android";

// Combines manufacturer and model into a friendly label, or undefined when the
// hardware provides neither.
function buildDeviceName(): string | undefined {
  const parts = [Device.manufacturer, Device.modelName].filter(
    (part): part is string => typeof part === "string" && part.trim() !== "",
  );

  if (parts.length === 0) {
    return undefined;
  }

  return parts.join(" ");
}

// Android 13+ only surfaces the permission prompt once a channel exists, so the
// alerts channel must be created before requesting permission.
async function ensureAlertsChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(ANDROID_ALERTS_CHANNEL_ID, {
    name: "Alerts",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// Registers the current Android installation for push notifications.
// Returns false when the user is unauthenticated, the platform is not Android,
// permission is denied, or no valid token is available.
export async function registerCurrentInstallationForPush(): Promise<boolean> {
  if (!firebaseAuth.currentUser) {
    return false;
  }

  if (Platform.OS !== ANDROID_PLATFORM) {
    return false;
  }

  await ensureAlertsChannel();

  const currentPermission = await Notifications.getPermissionsAsync();
  let granted = currentPermission.granted;

  if (!granted) {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    granted = requestedPermission.granted;
  }

  if (!granted) {
    return false;
  }

  const token = await Notifications.getDevicePushTokenAsync();
  if (typeof token.data !== "string" || token.data.trim() === "") {
    return false;
  }

  const input: RegisterPushNotificationInput = {
    installationId: await getInstallationId(),
    registrationId: token.data,
    platform: ANDROID_PLATFORM,
    deviceName: buildDeviceName(),
  };

  await registerPushNotification(input);

  return true;
}

// Updates the same installation's registration when Expo reports a rotated
// native token. The token is supplied by the caller, so this must not fetch it.
export async function saveRefreshedPushToken(
  registrationId: string,
): Promise<void> {
  if (!firebaseAuth.currentUser) {
    return;
  }

  if (Platform.OS !== ANDROID_PLATFORM) {
    return;
  }

  if (registrationId.trim() === "") {
    return;
  }

  const input: RegisterPushNotificationInput = {
    installationId: await getInstallationId(),
    registrationId,
    platform: ANDROID_PLATFORM,
    deviceName: buildDeviceName(),
  };

  await registerPushNotification(input);
}
