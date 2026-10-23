export const SETTINGS_COPY = {
  autoArchiveDescription:
    "Move alerts to Archived after the selected period. Alerts and their photos and videos are kept.",
  flaggedIncidents: "Nothing is deleted",
  flaggedIncidentsDescription:
    "Archiving only moves alerts out of your active list. The alert, its photos, and any clip stay available in Archived.",
  locationDescription: "Needed for incident tagging and SOS",
  deviceLocation: "Share while using app",
  contactLocation: "Share with emergency contacts",
  appearanceDescription: "Match appearance to your device's display",
} as const;

export const AUTO_ARCHIVE_OPTIONS = [
  { value: 24 as const, title: "24 hours", subtitle: "Default" },
  { value: 48 as const, title: "48 hours", subtitle: "Recommended" },
  { value: 72 as const, title: "72 hours", subtitle: "" },
  { value: 168 as const, title: "1 week", subtitle: "" },
];
