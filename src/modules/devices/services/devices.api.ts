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

/** Server-supported soft disconnect. Ownership and the local assigned ID remain. */
export async function disconnectHardwareDevice(deviceId: string, firebaseToken: string, device: "camera" | "button", signal?: AbortSignal): Promise<void> {
  const id = deviceId.trim();
  if (!id || (device !== "camera" && device !== "button")) throw new Error("A valid device ID and type are required.");
  const result = await apiClient.request<DeviceApiResponse<{ disconnected: string[]; devices: { device_id: string; device_type: string; status: string }[] }>>("/devices/disconnect", {
    method: "POST", token: firebaseToken, signal, body: JSON.stringify({ device, device_id: id }),
  });
  const data = result?.data;
  if (result?.success !== true || !Array.isArray(data?.devices) || data.devices.length !== 1 ||
    data.devices[0].device_id !== id || data.devices[0].device_type !== device || data.devices[0].status !== "disconnected" ||
    !Array.isArray(data.disconnected) || data.disconnected.some((value) => value !== id)) {
    throw new Error("Disconnection was not confirmed. Check device status before retrying.");
  }
}
