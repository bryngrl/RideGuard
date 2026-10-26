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

/** The current backend exposes claim-device as PATCH only; no release route exists. */
export async function releaseDevice(
  deviceId: string,
  _firebaseToken: string,
): Promise<void> {
  const trimmedId = deviceId.trim();
  if (!trimmedId) {
    throw new Error("Device ID is required.");
  }

  throw new Error("Device disconnect is not available yet.");
}
