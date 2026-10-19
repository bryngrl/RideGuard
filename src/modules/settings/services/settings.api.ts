import type {
  Retention,
  SettingsProfile,
  ThemePreference,
} from "../types/settings.types";

/*
 * BACKEND GUIDE
 * GET /settings -> getSettings
 * PATCH /settings/retention -> updateRetention
 * PATCH /settings/notifications -> updateNotifications
 * PATCH /settings/location -> updateLocationSharing
 * PATCH /settings/theme -> updateTheme
 * Profile and vehicle editing need backend update routes before they can save.
 */

export async function getSettings() {
  // BACKEND: replace body with GET /settings.
  return null;
}

export async function updateRetention(value: Retention) {
  // BACKEND: replace body with PATCH /settings/retention { retention: value }.
  return value;
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
