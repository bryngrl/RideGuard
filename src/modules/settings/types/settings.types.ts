export type Retention = 24 | 48 | 72;
export type ThemePreference = "light" | "dark" | "system";

export interface SettingsProfile {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  vehicleBrand: string;
  vehicleModel: string;
  plateNumber: string;
}

export interface SettingsSnapshot {
  retention: Retention;
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
  | "/devices"
  | "/settings/location"
  | "/settings/retention"
  | "/settings/display"
  | "/settings/notifications"
  | "/contact"
  | "/privacy/privacy"
  | "/settings/digital-safety"
  | "/settings/about";

export interface SettingsRowDefinition {
  id: string;
  title: string;
  section: string;
  iconKey: string;
  route?: SettingsRoute;
  searchKeywords: string[];
}
