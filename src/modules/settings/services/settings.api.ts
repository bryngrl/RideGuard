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
 * PATCH /profile/personal-info -> updateProfile
 * PATCH /profile/vehicle -> updateVehicle
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
  return value === 24 || value === 48 || value === 72 ? value : null;
}

export async function getSettings() {
  // BACKEND: replace body with GET /settings.
  return null;
}

/** GET /settings/auto-archive -> the account's saved period (null = Never). */
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
  return normalizeHours(envelope?.data?.autoArchiveHours);
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
  // BACKEND: replace body with PATCH /profile/personal-info profile.
  return profile;
}

export async function updateVehicle(
  vehicle: Pick<
    SettingsProfile,
    "vehicleBrand" | "vehicleModel" | "plateNumber"
  >,
) {
  // BACKEND: replace body with PATCH /profile/vehicle vehicle.
  return vehicle;
}
