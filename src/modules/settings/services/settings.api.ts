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
 * PATCH /profile/personal-info -> updateProfile
 * PATCH /profile/vehicle -> updateVehicle
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
