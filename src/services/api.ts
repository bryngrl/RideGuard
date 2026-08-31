export interface ProfilePayload {
  first_name: string;
  last_name: string;
  phone_number: string;
  vehicle: string;
  plate_number: string;
  contact_name?: string;
  emergency_phone_number?: string;
  relationship?: string;
}

const API_BASE_URL = "http://localhost:5565/v1";

export const submitProfile = async (
  payload: ProfilePayload,
  firebaseToken: string,
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/personal-info`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${firebaseToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Failed to submit profile",
      );
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
