// All tunable values for the Alerts feature live here, so each value has a
// single home. Change it once and every file that imports it stays in sync.

// How many alerts we ask the backend for in one page.
export const ALERTS_PAGE_SIZE = 10;

// How long (in milliseconds) the "Loaded successfully" message stays on screen
// after a new page finishes loading.
export const LOADED_MESSAGE_DURATION_MS = 1800;

// How close to the bottom of the list before we start loading the next page.
// It's a fraction of the screen height: 0.3 means "when 30% from the end".
export const END_REACHED_THRESHOLD = 0.3;

// Light blue background used to highlight an alert the user hasn't seen yet.
export const UNREAD_BACKGROUND_COLOR = "#E9F2FD";

// The realtime event name the backend sends when a new alert is created.
export const ALERT_CREATED_EVENT = "alert.created";

// The title shown for each alert, based on whether it is a real threat.
export const ALERT_TITLE = {
  NO_DETECTIONS: "No detections",
  WEAPON: "Weapon detected",
  VIOLENCE: "Violence detected",
  BOTH: "Violence and Weapon detected",
} as const;

// Ionicons icon names used across the alerts UI.
export const ALERT_ICON = {
  // Warning triangle for a real threat row.
  THREAT: "warning-outline",
  // Circle check for a cleared / false-alarm row.
  CLEAR: "checkmark-circle-outline",
  // Clock shown on a row that is still pending.
  PENDING: "time-outline",
  // Filled check shown in the "Loaded successfully" footer.
  LOADED: "checkmark-circle",
  // Clock icon on the auto-delete card in alert details.
  AUTO_DELETE: "time-outline",
  // Info icon on the response section in alert details.
  RESPONSE_INFO: "information-circle-outline",
} as const;

// --- Alert details: auto-delete card (static UI only, no countdown yet) ---

// Time shown remaining before the alert auto-deletes.
export const AUTO_DELETE_COUNTDOWN_LABEL = "47h 12m";
// How long the alert stays viewable in the app.
export const AUTO_DELETE_RETENTION_HOURS = "47h";

// Popup text shown when marking an alert as a false alarm fails.
export const FALSE_ALARM_ERROR_TITLE = "Couldn't update alert";
export const FALSE_ALARM_ERROR_MESSAGE =
  "Something went wrong. Please try again.";
