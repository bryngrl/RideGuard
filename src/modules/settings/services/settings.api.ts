import { apiClient } from "@/shared/api";

import type {
  AutoArchiveHours,
  SettingsProfile,
  ThemePreference,
} from "../types/settings.types";
import { toE164 } from "@/shared/lib/phone-utils";

/*
 * Server endpoints currently available:
 * GET /settings/auto-archive -> getAutoArchive
 * PATCH /settings/auto-archive -> updateAutoArchive
 * PATCH /profile/me -> updateAccountDetails
 * Notification, location and display preferences below are device-local.
 * Staging has no settings-wide, notifications, location or theme endpoints.
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

function readAutoArchive(envelope: StandardEnvelope<AutoArchiveData>): AutoArchiveHours {
  const value = envelope?.data?.autoArchiveHours;
  if (!envelope?.success || !(value === null || value === 24 || value === 48 || value === 72)) {
    throw new Error("The server did not confirm your auto-archive setting.");
  }
  return value;
}

export async function getSettings() {
  // No settings-wide endpoint exists; individual stores own local preferences.
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
  return readAutoArchive(envelope);
}

/** The settings endpoint maps both missing and explicitly disabled to null. */
export async function hasSavedAutoArchive(firebaseToken: string): Promise<boolean> {
  const envelope = await apiClient.get<StandardEnvelope<Record<string, unknown>>>(
    "/profile/me", firebaseToken,
  );
  if (!envelope?.success || !envelope.data || typeof envelope.data !== "object") {
    throw new Error("Unable to confirm your saved auto-archive preference.");
  }
  return Object.prototype.hasOwnProperty.call(envelope.data, "autoArchiveHours");
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
  const saved = readAutoArchive(envelope);
  if (saved !== value) throw new Error("The server did not save the selected auto-archive period.");
  return saved;
}

export async function updateNotifications(payload: {
  alertsEnabled?: boolean;
  pushEnabled?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
}) {
  // The caller persists this device-local preference in settings.store.
  return payload;
}

export async function updateLocationSharing(payload: {
  locationInApp?: boolean;
  locationWithContacts?: boolean;
}) {
  // The caller persists this device-local preference in settings.store.
  return payload;
}

export async function updateTheme(value: ThemePreference) {
  // The caller persists this device-local preference in settings.store.
  return value;
}

type EditableAccountField = "firstName" | "lastName" | "phone" |
  "vehicleBrand" | "vehicleModel" | "plateNumber";

/** Send only changed fields so one edit cannot overwrite another server value. */
export async function updateAccountDetails(
  changes: Partial<Pick<SettingsProfile, EditableAccountField>>,
  firebaseToken: string,
): Promise<void> {
  const body = {
    ...(changes.firstName !== undefined && { first_name: changes.firstName }),
    ...(changes.lastName !== undefined && { last_name: changes.lastName }),
    ...(changes.phone !== undefined && { phone_number: toE164(changes.phone) }),
    ...(changes.vehicleBrand !== undefined && { brand: changes.vehicleBrand }),
    ...(changes.vehicleModel !== undefined && { model: changes.vehicleModel }),
    ...(changes.plateNumber !== undefined && { plate_number: changes.plateNumber }),
  };
  if (!Object.keys(body).length) return;
  const envelope = await apiClient.patch<StandardEnvelope<unknown>>(
    "/profile/me", body, firebaseToken,
  );
  if (!envelope?.success) throw new Error(envelope?.message || "Unable to save your account.");
}
