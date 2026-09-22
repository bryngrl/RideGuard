export interface ProfilePayload {
  first_name: string;
  last_name: string;
  phone_number: string;
  vehicle: string;
  plate_number: string;
  color?: string;
  contact_name?: string;
  emergency_phone_number?: string;
  relationship?: string;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://rideguard-api-gvanehe0gbdvf9bw.japaneast-01.azurewebsites.net/v1";

export interface DeviceApiResponse<T = Record<string, unknown>> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  statusCode?: number;
  fields?: Record<string, string>;
}

export type DeviceType = "Camera" | "Metal-Detector";

// claim dev
export const claimDevice = async (
  deviceId: string,
  firebaseToken: string,
): Promise<DeviceApiResponse> => {
  const trimmedId = deviceId.trim();
  if (!trimmedId) {
    throw new Error("Device ID is required.");
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/devices/claim-device/${encodeURIComponent(trimmedId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      let errorMessage = data?.message || "Failed to claim device.";
      if (response.status === 404) {
        errorMessage = "Device not found. Please check your Device ID.";
      } else if (response.status === 401) {
        errorMessage = "Authentication failed. Please sign in again.";
      } else if (response.status === 422) {
        errorMessage = "Invalid user session. Please re-authenticate.";
      } else if (response.status === 429) {
        errorMessage = "Too many attempts. Please try again later.";
      }
      throw new Error(errorMessage);
    }

    return data as DeviceApiResponse;
  } catch (error) {
    console.error("claimDevice Error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unable to connect to the server. Please try again.");
  }
};
