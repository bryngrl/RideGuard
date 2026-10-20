export { AUTO_ARCHIVE_OPTIONS, SETTINGS_COPY } from "./config/settings-copy";
export const NOTIFICATION_COPY = {
  flags: "Flags",
  alerts: "Alerts",
  attackDetected: "Attack detected",
  alwaysOn: "Always on",
  delivery: "Delivery",
  push: "Push notification",
  sound: "Sound",
  vibration: "Vibration",
} as const;

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
        title: "Auto archive",
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
