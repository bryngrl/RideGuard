import { useAuthStore } from "@/modules/auth/store/auth.store";
import { appendPhoto } from "@/shared/api/photo-upload";
import { API_BASE_URL } from "@/shared/api/client";
import type { ImagePickerAsset } from "expo-image-picker";
import type { EmergencyContact } from "../types/emergency-contact.types";
import { useLoadingCountsStore } from "@/shared/store/loading-counts.store";

type ContactRecord = {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  photo_url: string | null;
  public_id: string | null;
};

type Envelope<T> = { success: boolean; message?: string; data: T };
export type ContactInput = { name: string; phone: string; email: string; relationship: string; photoAsset?: ImagePickerAsset | null };

const CACHE_MS = 30_000;
let cacheOwner: string | null = null;
let ownerEpoch = 0;
let revision = 0;
let cached: EmergencyContact[] | null = null;
let cachedAt = 0;
let cacheComplete = false;
const changes = new Map<string, { revision: number; value: EmergencyContact | null }>();
let inFlight: Promise<EmergencyContact[]> | null = null;
function syncOwner() {
  const uid = useAuthStore.getState().user?.uid ?? null;
  if (uid !== cacheOwner) {
    cacheOwner = uid; ownerEpoch++; revision++;
    cached = null; cachedAt = 0; cacheComplete = false; inFlight = null; changes.clear();
  }
  return uid;
}
useAuthStore.subscribe(syncOwner);
export function getCachedContacts(): EmergencyContact[] {
  return syncOwner() ? cached?.map((contact) => ({ ...contact })) ?? [] : [];
}
function context() {
  const uid = syncOwner();
  if (!uid) throw new Error("Log in to manage contacts.");
  return { uid, epoch: ownerEpoch };
}
function assertOwner(owner: ReturnType<typeof context>) {
  if (syncOwner() !== owner.uid || owner.epoch !== ownerEpoch) throw new Error("Account changed. Reopen contacts.");
}
function remember(contact: EmergencyContact, owner: ReturnType<typeof context>) {
  assertOwner(owner); revision++;
  changes.set(contact.id, { revision, value: contact });
  cached = cached?.some((item) => item.id === contact.id)
    ? cached.map((item) => item.id === contact.id ? contact : item) : [...(cached ?? []), contact];
  cachedAt = Date.now();
  if (cacheComplete) useLoadingCountsStore.getState().remember(owner.uid, "contacts", cached.length);
}

async function token() {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("Log in to manage contacts.");
  return user.getIdToken();
}

async function request<T>(path: string, method = "GET", body?: FormData, owner = context()): Promise<T> {
  assertOwner(owner);
  const authToken = await token();
  assertOwner(owner);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${authToken}` },
    body,
  });
  const envelope = await response.json().catch(() => null) as Envelope<T> | null;
  assertOwner(owner);
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
    email: record.email || "",
    relationship: record.relationship,
    profileImage: record.photo_url?.trim() || undefined,
  };
}

async function form(input: ContactInput) {
  const data = new FormData();
  data.append("name", input.name);
  data.append("phone", input.phone);
  data.append("email", input.email);
  data.append("relationship", input.relationship);
  if (input.photoAsset) await appendPhoto(data, input.photoAsset);
  return data;
}

export async function listContacts({ force = false }: { force?: boolean } = {}): Promise<EmergencyContact[]> {
  const owner = context();
  if (!force && cacheComplete && cached && Date.now() - cachedAt < CACHE_MS) return getCachedContacts();
  if (inFlight) return inFlight;
  const startedRevision = revision;
  const work = request<ContactRecord[]>("/profile/emergency-contacts", "GET", undefined, owner).then((records) => {
    assertOwner(owner);
    // A GET started before Save must not overwrite that confirmed save response.
    const merged = new Map(records.map((record) => { const contact = toContact(record); return [contact.id, contact]; }));
    for (const [id, change] of changes) if (change.revision > startedRevision) {
      if (change.value) merged.set(id, change.value); else merged.delete(id);
    }
    cached = [...merged.values()]; cacheComplete = true; cachedAt = Date.now(); changes.clear();
    useLoadingCountsStore.getState().remember(owner.uid, "contacts", cached.length);
    return getCachedContacts();
  });
  inFlight = work;
  try { return await work; }
  finally { if (inFlight === work) inFlight = null; }
}

export async function createContact(input: ContactInput): Promise<EmergencyContact> {
  const owner = context();
  const saved = toContact(await request<ContactRecord>("/profile/emergency-contacts", "POST", await form(input), owner));
  remember(saved, owner);
  return saved;
}

export async function updateContact(id: string, input: ContactInput): Promise<EmergencyContact> {
  const owner = context();
  const saved = toContact(await request<ContactRecord>(`/profile/emergency-contacts/${encodeURIComponent(id)}`, "PATCH", await form(input), owner));
  remember(saved, owner);
  return saved;
}

export async function deleteContact(id: string): Promise<void> {
  const owner = context();
  await request(`/profile/emergency-contacts/${encodeURIComponent(id)}`, "DELETE", undefined, owner);
  assertOwner(owner); revision++;
  changes.set(id, { revision, value: null });
  if (cached) { cached = cached.filter((item) => item.id !== id); cachedAt = Date.now(); }
  if (cacheComplete && cached) useLoadingCountsStore.getState().remember(owner.uid, "contacts", cached.length);
}
