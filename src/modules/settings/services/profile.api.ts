import { useAuthStore } from "@/modules/auth/store/auth.store";
import { appendPhoto } from "@/shared/api/photo-upload";
import type { ImagePickerAsset } from "expo-image-picker";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://rideguard-api-gvanehe0gbdvf9bw.japaneast-01.azurewebsites.net/v1";

export type ProfileDocument = {
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    email?: string;
    profileImageUrl?: string;
  };
  vehicle?: { brand?: string; model?: string; plateNumber?: string };
  photo_url?: string | null;
};

async function authToken() {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("Sign in with Google to manage your profile.");
  return user.getIdToken();
}

async function readResponse<T>(response: Response): Promise<T> {
  const envelope = await response.json().catch(() => null) as
    | { success: boolean; message?: string; data: T }
    | null;
  if (!response.ok || !envelope?.success) {
    throw new Error(envelope?.message || `Request failed (${response.status}).`);
  }
  return envelope.data;
}

export async function getProfile(): Promise<ProfileDocument> {
  return readResponse<ProfileDocument>(await fetch(`${API_BASE_URL}/profile/me`, {
    headers: { Authorization: `Bearer ${await authToken()}` },
  }));
}

export async function uploadProfilePhoto(asset: ImagePickerAsset): Promise<{ photo_url: string }> {
  const body = new FormData();
  await appendPhoto(body, asset);
  return readResponse<{ photo_url: string }>(await fetch(`${API_BASE_URL}/profile/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await authToken()}` },
    body,
  }));
}
