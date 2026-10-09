/**
 * One camera as returned by GET /devices/cameras. The backend stores the
 * stream URL the ESP32 reports, so it can be null until the board has reported
 * one, and `online` reflects whether it reported recently.
 */
export interface LiveCamera {
  deviceId: string;
  streamUrl: string | null;
  online: boolean;
  lastSeenAt: string | null;
}
