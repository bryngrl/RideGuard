import { PhoneCapture } from "../../../../modules/phone-capture";
import { endPhoneSession } from "./phone-camera.api";

/**
 * Stop native capture and end the server session. Used on logout so frames
 * cannot keep uploading for the account that signed out. Never throws.
 */
export async function stopPhoneCapture(firebaseToken?: string): Promise<void> {
  if (!PhoneCapture) return;

  const status = PhoneCapture.getStatus();
  PhoneCapture.stop();

  if (firebaseToken && status.active && status.deviceId && status.sessionId) {
    try {
      await endPhoneSession(firebaseToken, status.deviceId, status.sessionId);
    } catch (error) {
      // The session still expires on its own, and native capture is stopped.
      console.warn("Could not end the phone session:", error);
    }
  }
}
