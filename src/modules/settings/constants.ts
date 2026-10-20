export { RETENTION_OPTIONS, SETTINGS_COPY } from "./config/settings-copy";
export const NOTIFICATION_COPY = {
  alertsHeading: "Alerts",
  alerts: "Alerts",
  possibleThreat: "Possible weapon or violence detected",
  alwaysOn: "Always on",
  delivery: "Delivery",
  push: "Push notification",
} as const;

export const SETTINGS_SECTIONS = [
  {
    title: "Safety & Monitoring",
    rows: [
      { title: "SOS Preferences", icon: "sos", route: "/settings/sos-preferences" },
      { title: "Emergency contacts", icon: "contact", route: "/contact" },
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
      { title: "Archives", icon: "archive", route: "/settings/archives" },
    ],
  },
  {
    title: "App & Account",
    rows: [
      { title: "MPIN", icon: "lock", route: "/mpin/manage" },
      { title: "Display", icon: "display", route: "/settings/display" },
      {
        title: "Notification",
        icon: "notification",
        route: "/settings/notifications",
      },
    ],
  },
  {
    title: "Information",
    rows: [
      {
        title: "Terms of Service",
        icon: "terms",
        route: "/settings/terms-of-service",
      },
      { title: "Privacy Policy", icon: "privacy", route: "/privacy/privacy" },
      { title: "About", icon: "about", route: "/settings/about" },
    ],
  },
] as const;

export type SettingRow = (typeof SETTINGS_SECTIONS)[number]["rows"][number];
