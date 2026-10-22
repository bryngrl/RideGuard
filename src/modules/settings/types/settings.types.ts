// Auto-archive period in hours, or null for "Never".
export type AutoArchiveHours = 24 | 48 | 72 | null;
export type ThemePreference = "light" | "dark" | "system";

export interface SettingsProfile {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  vehicleBrand: string;
  vehicleModel: string;
  plateNumber: string;
  // The signed-in account's profile photo (GET /auth/me, or Firebase for
  // Google sign-in). Null when there isn't one.
  photoUrl: string | null;
}

export interface SettingsSnapshot {
  autoArchiveHours: AutoArchiveHours;
  alertsEnabled: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  locationInApp: boolean;
  locationWithContacts: boolean;
  themePreference: ThemePreference;
  searchHistory: string[];
}

export type SettingsRoute =
  | "/mpin/manage"
  | "/devices"
  | "/settings/location"
  | "/settings/retention"
  | "/settings/display"
  | "/settings/notifications"
  | "/contact"
  | "/privacy/privacy"
  | "/settings/digital-safety"
  | "/settings/terms-of-service"
  | "/settings/about"
  | "/settings/sos-preferences"
  | "/settings/archives";

export interface SettingsRowDefinition {
  id: string;
  title: string;
  section: string;
  iconKey: string;
  route?: SettingsRoute;
  searchKeywords: string[];
}
