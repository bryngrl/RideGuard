import type { MpinAuthorization, MpinDelivery, MpinStatus } from "../services/mpin.api";

export const MPIN_LENGTH = 4;
export const isCompleteMpin = (value: string) => /^\d{4}$/.test(value);

// Convert once when receiving a server response; subsequent UI timers use local time.
export function localDeadline(deadline: number, serverTime?: number, receivedAt = Date.now()): number {
  return serverTime === undefined ? deadline : receivedAt + deadline - serverTime;
}

export function validAuthorization(value: MpinAuthorization | null, now = Date.now()): value is MpinAuthorization {
  return !!value && typeof value.token === "string" && value.token.trim().length > 0 &&
    (value.serverTime === undefined || Number.isFinite(value.serverTime)) &&
    Number.isFinite(value.expiresAt) && localDeadline(value.expiresAt, value.serverTime, now) > now;
}

export function validMpinStatus(value: MpinStatus): boolean {
  return !!value && typeof value.configured === "boolean" && typeof value.requiresUnlock === "boolean" &&
    (value.locked === undefined || typeof value.locked === "boolean") &&
    (value.emergencyAccessAllowed === undefined || typeof value.emergencyAccessAllowed === "boolean") &&
    (value.emergencyAlertIds === undefined || (Array.isArray(value.emergencyAlertIds) && value.emergencyAlertIds.every((id) => typeof id === "string" && id.length > 0))) &&
    (value.serverTime === undefined || Number.isFinite(value.serverTime)) &&
    (value.unlockExpiresAt === undefined || Number.isFinite(value.unlockExpiresAt)) &&
    (value.lockedUntil === undefined || (Number.isFinite(value.lockedUntil) && value.lockedUntil >= 0)) &&
    (value.remainingAttempts === undefined || (Number.isInteger(value.remainingAttempts) && value.remainingAttempts >= 0));
}

export function validDelivery(value: MpinDelivery, now = Date.now()): boolean {
  return !!value && typeof value.challengeId === "string" && value.challengeId.trim().length > 0 &&
    typeof value.maskedDestination === "string" && value.maskedDestination.trim().length > 0 &&
    (value.serverTime === undefined || Number.isFinite(value.serverTime)) &&
    Number.isFinite(value.expiresAt) && localDeadline(value.expiresAt, value.serverTime, now) > now && Number.isFinite(value.resendAt);
}

export type MpinAccess = "allowed" | "status" | "intro" | "login";
export function resolveMpinAccess({ enabled, demo, uid, owner, status, unlocked }: {
  enabled: boolean; demo: boolean; uid: string | null; owner: string | null;
  status: MpinStatus | null; unlocked: boolean;
}): MpinAccess {
  if (!enabled || demo) return "allowed";
  if (!uid || uid !== owner || !status || !validMpinStatus(status)) return "status";
  if (!status.configured) return "intro";
  if (status.requiresUnlock || status.locked || status.remainingAttempts === 0 ||
    (status.unlockExpiresAt !== undefined && status.unlockExpiresAt <= Date.now()) || !unlocked) return "login";
  return "allowed";
}

export function isMpinEmergencyRoute(segments: readonly string[]): boolean {
  return segments.includes("sos") || (segments.includes("alerts") && segments.includes("[alertId]"));
}

export function canAccessMpinEmergency(segments: readonly string[], status: MpinStatus | null, alertId?: string): boolean {
  if (status?.emergencyAccessAllowed !== true) return false;
  if (segments.includes("sos")) return true;
  // Alert details contain sensitive media; only a specifically authorized alert
  // may be viewed while locked. The alert list and account pages stay guarded.
  return segments.includes("alerts") && segments.includes("[alertId]") && !!alertId &&
    status.emergencyAlertIds?.includes(alertId) === true;
}

// Only existing app destinations may be resumed after unlocking; never accept
// arbitrary external URLs or recovery routes as a post-verification destination.
export function safeReturnPath(value: string): string {
  if (["/", "/settings", "/settings/account", "/settings/account/edit", "/settings/location", "/settings/retention",
    "/settings/display", "/settings/notifications", "/settings/search", "/settings/about", "/settings/digital-safety", "/settings/terms-of-service",
    "/camera", "/alerts", "/contact", "/contact/add-contact", "/contact/edit-contact", "/devices"].includes(value)) return value;
  if (/^\/alerts\/[A-Za-z0-9_-]+$/.test(value)) return value;
  return "/";
}
