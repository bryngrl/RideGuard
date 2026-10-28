import { apiClient } from "@/shared/api";
import type { DeviceApiResponse } from "../types/devices.types";

export async function claimDevice(
  deviceId: string,
  firebaseToken: string,
): Promise<DeviceApiResponse> {
  const trimmedId = deviceId.trim();
  if (!trimmedId) {
    throw new Error("Device ID is required.");
  }

  return apiClient.patch<DeviceApiResponse>(
    `/devices/claim-device/${encodeURIComponent(trimmedId)}`,
    undefined,
    firebaseToken,
  );
}

export interface ReleasedDeviceResult {
  released: true;
  device_id: string;
  device_type: "camera" | "button";
  assigned_user_id: null;
}

/** True unpairing requires the release contract; soft disconnect cannot confirm it. */
export async function releaseDevice(
  deviceId: string,
  firebaseToken: string,
  device: "camera" | "button",
  signal?: AbortSignal,
): Promise<void> {
  const trimmedId = deviceId.trim();
  if (!trimmedId) {
    throw new Error("Device ID is required.");
  }

  if (device !== "camera" && device !== "button") throw new Error("Invalid device type.");
  const response = await apiClient.request<DeviceApiResponse<ReleasedDeviceResult>>("/devices/release", {
    method: "POST", token: firebaseToken, signal,
    body: JSON.stringify({ device, device_id: trimmedId }),
  });
  // /devices/release is the required backend contract, not an existing soft
  // disconnect fallback. Keep local hardware until ownership removal is explicit.
  if (response?.success !== true || response.data?.released !== true ||
    response.data.device_id !== trimmedId || response.data.device_type !== device ||
    response.data.assigned_user_id !== null) {
    throw new Error("Unpairing was not confirmed. Try again.");
  }
}
