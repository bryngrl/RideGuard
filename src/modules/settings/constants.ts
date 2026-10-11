export type SettingTheme = "light" | "dark" | "system";
export type Retention = 24 | 48 | 72;

export const SETTINGS_SECTIONS = [
  {
    title: "Safety and hardware",
    rows: [
      { title: "Camera and quick button", icon: "camera", route: "/devices" },
      {
        title: "Location sharing",
        icon: "location",
        route: "/settings/location",
      },
      {
        title: "Data and footage retention",
        icon: "filmstrip",
        route: "/settings/retention",
      },
    ],
  },
  {
    title: "Preferences",
    rows: [
      { title: "Display", icon: "display", route: "/settings/display" },
      {
        title: "Notifications",
        icon: "notification",
        route: "/settings/notifications",
      },
      { title: "Emergency contacts", icon: "contact", route: "/contact" },
    ],
  },
  {
    title: "General",
    rows: [
      { title: "Privacy policy", icon: "about", route: "/privacy/privacy" },
      {
        title: "Digital safety",
        icon: "about",
        route: "/settings/digital-safety",
      },
      { title: "About", icon: "about", route: "/settings/about" },
    ],
  },
] as const;

export type SettingRow = (typeof SETTINGS_SECTIONS)[number]["rows"][number];
