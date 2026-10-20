export const SETTINGS_COPY = {
  retentionDescription:
    "Select how long trip recordings without alerts and system logs are stored before being permanently deleted.",
  flaggedIncidents: "Incident footage",
  flaggedIncidentsDescription:
    "If a possible safety threat is detected during a ride, the associated footage will be saved automatically until reviewed.",
  locationDescription: "Needed for incident tagging and SOS",
  deviceLocation: "Share while using app",
  contactLocation: "Share with emergency contacts",
  appearanceDescription: "Match appearance to your device's display",
} as const;

export const RETENTION_OPTIONS = [
  {
    value: 24 as const,
    title: "24 hours",
    subtitle: "Recommended for privacy",
  },
  { value: 48 as const, title: "48 hours", subtitle: "Default" },
  { value: 72 as const, title: "72 hours", subtitle: "" },
];
