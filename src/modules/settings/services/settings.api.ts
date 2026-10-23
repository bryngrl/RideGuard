import { apiClient } from "@/shared/api";

import type {
  AutoArchiveHours,
  SettingsProfile,
  ThemePreference,
} from "../types/settings.types";

/*
 * BACKEND GUIDE
 * GET /settings/auto-archive -> getAutoArchive
 * PATCH /settings/auto-archive -> updateAutoArchive
 * PATCH /settings/notifications -> updateNotifications
 * PATCH /settings/location -> updateLocationSharing
 * PATCH /settings/theme -> updateTheme
 * Profile and vehicle editing need backend update routes before they can save.
 */

interface StandardEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface AutoArchiveData {
  autoArchiveHours: AutoArchiveHours;
}

function normalizeHours(value: unknown): AutoArchiveHours {
  return value === 24 || value === 48 || value === 72 || value === 168 ? value : null;
}

export async function getSettings() {
  // BACKEND: replace body with GET /settings.
  return null;
}

/** GET /settings/auto-archive -> the account's saved period. */
export async function getAutoArchive(
  firebaseToken: string,
): Promise<AutoArchiveHours> {
  const envelope = await apiClient.get<StandardEnvelope<AutoArchiveData>>(
    "/settings/auto-archive",
    firebaseToken,
  );
  return normalizeHours(envelope?.data?.autoArchiveHours);
}

/** PATCH /settings/auto-archive -> the saved period echoed back. */
export async function updateAutoArchive(
  value: AutoArchiveHours,
  firebaseToken: string,
): Promise<AutoArchiveHours> {
  const envelope = await apiClient.patch<StandardEnvelope<AutoArchiveData>>(
    "/settings/auto-archive",
    { autoArchiveHours: value },
    firebaseToken,
  );
  const saved = normalizeHours(envelope?.data?.autoArchiveHours);
  if (saved !== value) throw new Error("The server did not save the selected auto-archive period.");
  return saved;
}

export async function updateNotifications(payload: {
  alertsEnabled?: boolean;
  pushEnabled?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
}) {
  // BACKEND: replace body with PATCH /settings/notifications payload.
  return payload;
}

export async function updateLocationSharing(payload: {
  locationInApp?: boolean;
  locationWithContacts?: boolean;
}) {
  // BACKEND: replace body with PATCH /settings/location payload.
  return payload;
}

export async function updateTheme(value: ThemePreference) {
  // BACKEND: replace body with PATCH /settings/theme { themePreference: value }.
  return value;
}

export async function updateProfile(
  profile: Pick<SettingsProfile, "firstName" | "lastName" | "phone">,
) {
  void profile;
  throw new Error("Profile editing is not available from the current API yet.");
}

export async function updateVehicle(
  vehicle: Pick<
    SettingsProfile,
    "vehicleBrand" | "vehicleModel" | "plateNumber"
  >,
) {
  void vehicle;
  throw new Error("Vehicle editing is not available from the current API yet.");
}
