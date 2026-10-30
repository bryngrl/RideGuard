import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "../store/auth.store";
import { signOutGoogle } from "../hooks/use-google-signin";
import { revokeLogoutSession } from "./logout-session";
import { stopPhoneCapture } from "@/modules/phone-camera";
import { getInstallationId, unregisterPushNotification } from "@/modules/notifications";
import { useAlertsStore } from "@/modules/alerts/store/alerts.store";
import { useSettingsStore } from "@/modules/settings/store/settings.store";

/** Credentials were changed on the server: end the local session immediately. */
export async function endCredentialChangeSession(uid: string, token: string): Promise<boolean> {
  if (auth.currentUser?.uid !== uid) return false;
  // Native capture stops synchronously inside stopPhoneCapture. Network cleanup
  // uses the captured old token and must not delay local logout after revocation.
  void Promise.allSettled([
    stopPhoneCapture(token), revokeLogoutSession(token), signOutGoogle(),
    getInstallationId().then((id) => unregisterPushNotification(token, id)),
  ]);
  try { await signOut(auth); }
  finally {
    if ((!auth.currentUser || auth.currentUser.uid === uid) && useAuthStore.getState().user?.uid === uid) {
      useAuthStore.getState().clearAuth();
    }
  }
  if (auth.currentUser) return false;
  if (useAuthStore.getState().user?.uid === uid) useAuthStore.getState().clearAuth();
  useAlertsStore.getState().clearAlerts();
  useSettingsStore.getState().resetAutoArchive();
  return true;
}
