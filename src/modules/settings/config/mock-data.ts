import type {
  AutoArchiveHours,
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
  // Default to 24 hours until the server's saved preference is loaded.
  autoArchiveHours: 24 as AutoArchiveHours,
  alertsEnabled: true,
  pushEnabled: true,
  soundEnabled: false,
  vibrationEnabled: false,
  locationInApp: true,
  locationWithContacts: true,
  themePreference: "light" as ThemePreference,
  searchHistory: [] as string[],
};
