import { apiClient } from "@/shared/api";

export interface ProfilePayload {
  first_name: string;
  last_name: string;
  phone_number: string;
  brand: string;
  model: string;
  plate_number: string;
  color?: string;
  contact_name?: string;
  emergency_phone_number?: string;
  relationship?: string;
}

export interface DeviceApiResponse<T = Record<string, unknown>> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  statusCode?: number;
  fields?: Record<string, string>;
}

export function submitProfile(
  payload: ProfilePayload,
  firebaseToken: string,
) {
  return apiClient.post("/profile/personal-info", payload, firebaseToken);
}

export function claimDevice(
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
