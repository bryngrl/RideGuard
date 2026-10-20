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
  // Default Never until the user explicitly chooses a period; the server is the
  // source of truth and overwrites this on load.
  autoArchiveHours: null as AutoArchiveHours,
  alertsEnabled: true,
  pushEnabled: true,
  soundEnabled: false,
  vibrationEnabled: false,
  locationInApp: true,
  locationWithContacts: true,
  themePreference: "system" as ThemePreference,
  searchHistory: [] as string[],
};
