import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, PermissionsAndroid } from "react-native";

import { useAuthStore } from "@/modules/auth/store/auth.store";
import { getInstallationId } from "@/modules/notifications/services/installation-id";
import { PHONE_UPLOAD_URL } from "@/shared/constants/inference";
import {
  PHONE_CAPTURE_INTERVAL_MS,
  PHONE_CAPTURE_SESSION_DURATION_MS,
} from "@/shared/constants/phone-capture";

import {
  PhoneCapture,
  type PhoneCaptureLens,
  type PhoneCaptureStatus,
} from "../../../../modules/phone-capture";
import {
  endPhoneSession,
  registerPhoneCamera,
  startPhoneSession,
} from "../services/phone-camera.api";

const TERMINAL_STATES = new Set(["stopped", "completed", "error"]);

/**
 * Phone camera controls. The native service owns the session; this hook only
 * reads its status, so remounting the screen never assumes capture stopped.
 */
export function usePhoneCapture() {
  const user = useAuthStore((state) => state.user);

  const [status, setStatus] = useState<PhoneCaptureStatus | null>(
    () => PhoneCapture?.getStatus() ?? null,
  );
  const [lenses] = useState<PhoneCaptureLens[]>(
    () => PhoneCapture?.getAvailableLenses() ?? [],
  );
  const [lens, setLens] = useState<PhoneCaptureLens>(() =>
    lenses.includes("front") ? "front" : (lenses[0] ?? "front"),
  );
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSettings, setNeedsSettings] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // Sessions seen running in this app process, so a restored "completed"
  // state from an earlier launch is not ended again.
  const runningSessions = useRef(new Set<string>());

  // Native status events, plus a fresh read whenever the app comes back.
  useEffect(() => {
    if (!PhoneCapture) return;
    const subscription = PhoneCapture.addListener("onStatus", setStatus);
    const appState = AppState.addEventListener("change", (next) => {
      if (next === "active") setStatus(PhoneCapture?.getStatus() ?? null);
    });
    setStatus(PhoneCapture.getStatus());
    return () => {
      subscription.remove();
      appState.remove();
    };
  }, []);

  // Register (or look up) this installation's phone camera.
  useEffect(() => {
    if (!PhoneCapture || !user) {
      setDeviceId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const id = await registerPhoneCamera(token, await getInstallationId());
        if (!cancelled) setDeviceId(id);
      } catch (err) {
        console.error("Phone camera registration failed:", err);
        if (!cancelled) setError("Could not set up the phone camera.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // When a session ends while the app is open, close it on the server too so
  // the phone shows offline right away. Best effort: it expires anyway.
  useEffect(() => {
    const sessionId = status?.sessionId;
    const id = status?.deviceId;
    if (!sessionId || !id) return;
    if (status.active) {
      runningSessions.current.add(sessionId);
      return;
    }
    if (!user || !TERMINAL_STATES.has(status.state)) return;
    if (!runningSessions.current.delete(sessionId)) return;
    user
      .getIdToken()
      .then((token) => endPhoneSession(token, id, sessionId))
      .catch((err) => console.warn("Could not end the phone session:", err));
  }, [status?.active, status?.state, status?.sessionId, status?.deviceId, user]);

  // Tick for the remaining-time display only.
  useEffect(() => {
    if (!status?.active) return;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [status?.active]);

  const start = useCallback(async () => {
    if (!PhoneCapture || !user || !deviceId || isBusy) return;
    if (PhoneCapture.getStatus().active) return;

    setIsBusy(true);
    setError(null);
    setNeedsSettings(false);
    let sessionId: string | null = null;
    let token: string | null = null;

    try {
      const camera = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera access",
          message:
            "RideGuard uses your phone camera to send one photo per second for threat detection, even when the app is in the background. It stops after 10 minutes or when you tap Stop.",
          buttonPositive: "Allow",
        },
      );
      if (camera !== PermissionsAndroid.RESULTS.GRANTED) {
        setNeedsSettings(camera === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);
        setError(
          camera === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
            ? "Camera access is off. Turn it on in Android settings to use the phone camera."
            : "Camera access is needed to start.",
        );
        return;
      }

      // Without notification access the session still runs, but the ongoing
      // notification and its Stop button are hidden. The screen says so.
      let { granted } = await Notifications.getPermissionsAsync();
      if (!granted) {
        granted = (await Notifications.requestPermissionsAsync()).granted;
      }

      token = await user.getIdToken();
      const session = await startPhoneSession(
        token,
        deviceId,
        PHONE_CAPTURE_SESSION_DURATION_MS,
      );
      sessionId = session.sessionId;

      setStatus(
        PhoneCapture.start({
          uploadUrl: PHONE_UPLOAD_URL,
          uploadToken: session.uploadToken,
          deviceId: session.deviceId,
          sessionId: session.sessionId,
          lens,
          intervalMs: PHONE_CAPTURE_INTERVAL_MS,
          durationMs: PHONE_CAPTURE_SESSION_DURATION_MS,
        }),
      );
    } catch (err) {
      console.error("Phone capture start failed:", err);
      setError("Could not start the phone camera. Try again.");
      if (token && sessionId) {
        endPhoneSession(token, deviceId, sessionId).catch(() => undefined);
      }
    } finally {
      setIsBusy(false);
    }
  }, [deviceId, isBusy, lens, user]);

  const stop = useCallback(() => {
    PhoneCapture?.stop();
  }, []);

  const remainingMs =
    status?.active && status.deadlineAt
      ? Math.max(0, status.deadlineAt - now)
      : 0;

  return {
    supported: PhoneCapture !== null,
    status,
    deviceId,
    lenses,
    lens: status?.active && status.lens ? status.lens : lens,
    setLens,
    remainingMs,
    isBusy,
    error,
    needsSettings,
    start,
    stop,
  };
}

export type PhoneCapture = ReturnType<typeof usePhoneCapture>;
