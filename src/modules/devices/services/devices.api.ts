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

/** Backend contract: release the signed-in user's claim on this device. */
export async function releaseDevice(
  deviceId: string,
  firebaseToken: string,
): Promise<void> {
  const trimmedId = deviceId.trim();
  if (!trimmedId) {
    throw new Error("Device ID is required.");
  }

  const response = await apiClient.delete<DeviceApiResponse | null>(
    `/devices/claim-device/${encodeURIComponent(trimmedId)}`,
    firebaseToken,
  );
  if (response?.success === false) {
    throw new Error(response.message || "Could not disconnect the device.");
  }
}
