import { useAuthStore } from "@/modules/auth/store/auth.store";
import { appendPhoto } from "@/shared/api/photo-upload";
import { API_BASE_URL } from "@/shared/api/client";
import type { ImagePickerAsset } from "expo-image-picker";
import type { EmergencyContact } from "../types/emergency-contact.types";

type ContactRecord = {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  photo_url: string | null;
  public_id: string | null;
};

type Envelope<T> = { success: boolean; message?: string; data: T };
type ContactInput = { name: string; phone: string; relationship: string; photoAsset?: ImagePickerAsset | null };

async function token() {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("Log in to manage contacts.");
  return user.getIdToken();
}

async function request<T>(path: string, method = "GET", body?: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${await token()}` },
    body,
  });
  const envelope = await response.json().catch(() => null) as Envelope<T> | null;
  if (!response.ok || !envelope?.success) {
    throw new Error(envelope?.message || `Request failed (${response.status}).`);
  }
  return envelope.data;
}

function toContact(record: ContactRecord): EmergencyContact {
  return {
    id: record.id,
    name: record.name,
    phoneNumber: record.phone,
    relationship: record.relationship,
    profileImage: record.photo_url ?? undefined,
  };
}

async function form(input: ContactInput) {
  const data = new FormData();
  data.append("name", input.name);
  data.append("phone", input.phone);
  data.append("relationship", input.relationship);
  if (input.photoAsset) await appendPhoto(data, input.photoAsset);
  return data;
}

export async function listContacts(): Promise<EmergencyContact[]> {
  return (await request<ContactRecord[]>("/profile/emergency-contacts")).map(toContact);
}

export async function createContact(input: ContactInput): Promise<EmergencyContact> {
  return toContact(await request<ContactRecord>("/profile/emergency-contacts", "POST", await form(input)));
}

export async function updateContact(id: string, input: ContactInput): Promise<EmergencyContact> {
  return toContact(await request<ContactRecord>(`/profile/emergency-contacts/${encodeURIComponent(id)}`, "PATCH", await form(input)));
}

export async function deleteContact(id: string): Promise<void> {
  await request(`/profile/emergency-contacts/${encodeURIComponent(id)}`, "DELETE");
}
