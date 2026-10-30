/**
 * Phone camera capture timing. These are the only copies: the native service
 * receives them at Start, validates them, and keeps them for that session.
 * Change them here.
 */
export const PHONE_CAPTURE_INTERVAL_MS = 1_000;
export const PHONE_CAPTURE_SESSION_DURATION_MS = 10 * 60 * 1_000;

/** Available in Android app builds by default; allow an explicit rollout opt-out. */
export const PHONE_CAPTURE_ENABLED =
  process.env.EXPO_PUBLIC_PHONE_CAPTURE_ENABLED !== "false";
