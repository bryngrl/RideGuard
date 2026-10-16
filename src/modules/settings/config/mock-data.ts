import type {
  Retention,
  SettingsProfile,
  ThemePreference,
} from "../types/settings.types";

// BACKEND: replace with GET /profile/me response.
export const mockProfile: SettingsProfile = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  vehicleBrand: "",
  vehicleModel: "",
  plateNumber: "",
  photoUrl: null,
};

// BACKEND: replace with GET /settings response defaults.
export const mockSettings = {
  retention: 48 as Retention,
  alertsEnabled: true,
  pushEnabled: true,
  soundEnabled: false,
  vibrationEnabled: false,
  locationInApp: true,
  locationWithContacts: true,
  themePreference: "system" as ThemePreference,
  searchHistory: [] as string[],
};
