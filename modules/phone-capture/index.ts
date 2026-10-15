import { type NativeModule, requireOptionalNativeModule } from "expo";

export type PhoneCaptureLens = "front" | "back";

export type PhoneCaptureState =
  | "idle"
  | "starting"
  | "connecting"
  | "capturing"
  | "uploading"
  | "interrupted"
  | "stopped"
  | "completed"
  | "error";

/**
 * Snapshot reported by the native service. `capturing` means the camera is on
 * but the server has not confirmed frames yet; `uploading` means a server ack
 * arrived in the last few seconds. Neither proves inference finished.
 */
export interface PhoneCaptureStatus {
  state: PhoneCaptureState;
  active: boolean;
  lens: PhoneCaptureLens | null;
  deviceId: string | null;
  sessionId: string | null;
  intervalMs: number | null;
  durationMs: number | null;
  remainingMs: number;
  deadlineAt: number | null;
  cameraActive: boolean;
  connected: boolean;
  framesCaptured: number;
  framesSent: number;
  framesDropped: number;
  serverReceived: number;
  serverSampled: number;
  reason: string | null;
  endedAt: number | null;
  notificationsAllowed: boolean;
}

export interface PhoneCaptureStartOptions {
  uploadUrl: string;
  uploadToken: string;
  deviceId: string;
  sessionId: string;
  lens: PhoneCaptureLens;
  intervalMs: number;
  durationMs: number;
}

type PhoneCaptureEvents = {
  onStatus: (status: PhoneCaptureStatus) => void;
};

declare class PhoneCaptureNativeModule extends NativeModule<PhoneCaptureEvents> {
  getStatus(): PhoneCaptureStatus;
  getAvailableLenses(): PhoneCaptureLens[];
  start(options: PhoneCaptureStartOptions): PhoneCaptureStatus;
  stop(): void;
}

// Android only. Null on iOS, web, and builds made before the module existed.
export const PhoneCapture =
  requireOptionalNativeModule<PhoneCaptureNativeModule>("PhoneCapture");
