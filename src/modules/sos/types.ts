export type SubmissionStatus = "queued" | "sending" | "accepted" | "failed" | "unknown" | "cancelled";
export type Delivery = {
  status: "pending" | "sent" | "delivered" | "failed" | "unknown";
  observedAt: string | null; acceptedAt: string; expiresAt: string;
  tracking: "active" | "complete" | "timed_out" | "unavailable";
  lastAttemptAt: string | null; lastCheckedAt: string | null;
  lastCheckError: string | null; failureCode: string | null;
};
export type StatusRefresh = { state: "idle" | "pending" | "complete" | "partial" | "unavailable";
  requestedAt: string | null; expiresAt: string | null; nextAllowedAt: string | null };
export type Submission = { status: SubmissionStatus; updatedAt: string; errorCode?: string; delivery?: Delivery | null };
export type EmailSubmission = { status: "queued" | "sending" | "sent" | "failed" | "unknown"; updatedAt: string; errorCode?: string };
export type SosLocation = { latitude: number; longitude: number; capturedAt: string; accuracyMeters: number | null };
export type SosInput = { requestId: string; alertId?: string; location: SosLocation | null };
export type SosRecord = {
  sosId: string; requestId: string; alertId: string | null; status: "active" | "ended";
  createdAt: string; endedAt: string | null; location: SosLocation | null;
  statusRefresh?: StatusRefresh;
  // Email is independent from SMS; the backend may omit it on legacy SOS records.
  recipients: { contactId: string; name: string; phone: string; email?: string; initial: Submission; ended: Submission | null;
  initialEmail?: EmailSubmission; endedEmail?: EmailSubmission | null }[];
};
export type Recovery = { uid: string; requestId: string; body: SosInput | null; sosId: string | null; stopPending: boolean };

export function trackingDeadline(record: SosRecord | null): number | null {
  const dates = record?.recipients.flatMap(r => [r.initial, r.ended].flatMap(s => s?.delivery?.tracking === "active" ? [Date.parse(s.delivery.expiresAt)] : [])) ?? [];
  if (record?.statusRefresh?.state === "pending" && record.statusRefresh.expiresAt) dates.push(Date.parse(record.statusRefresh.expiresAt));
  return dates.length ? Math.max(...dates) : null;
}
export function hasPending(record: SosRecord | null, now = Date.now()): boolean {
  return !!record && (!!record.recipients.some(r => [r.initial, r.ended].some(s => s?.status === "queued" || s?.status === "sending") ||
    [r.initialEmail, r.endedEmail].some(s => s?.status === "queued" || s?.status === "sending")) ||
    (trackingDeadline(record) ?? 0) > now);
}

export const submissionLabel: Record<SubmissionStatus, string> = {
  queued: "Queued", sending: "Submitting", accepted: "Submitted to SMS provider",
  failed: "Failed", unknown: "Submission could not be confirmed", cancelled: "Cancelled",
};

export function messagePresentation(s: Submission, now = Date.now()) {
  const d = s.delivery;
  if (d?.status === "delivered") return { label: "Delivered", icon: "checkmark-done-circle" as const, detail: "Delivery confirmed. This does not mean it was read." };
  if (d?.status === "failed" || s.status === "failed") return { label: "Failed", icon: "close-circle" as const,
    detail: d?.status === "failed" || s.errorCode === "delivery_failed" ? "The message could not be delivered. Contact someone directly." :
      s.errorCode === "authentication_failed" ? "The messaging service could not send this message. Contact someone directly." :
      s.errorCode === "expired" ? "The send request expired. Contact someone directly." : "The message could not be sent. Contact someone directly." };
  if (s.status === "cancelled") return { label: "Cancelled", icon: "ban" as const, detail: "This message was not submitted." };
  if (s.status === "queued" || s.status === "sending") return { label: s.status === "queued" ? "Queued" : "Sending", icon: "time" as const, detail: "Waiting for submission." };
  const active = d?.tracking === "active" && Date.parse(d.expiresAt) > now;
  const problem = d?.lastCheckError && d.lastCheckError !== "provider_unknown" ? " Status check unavailable." : "";
  if (d?.status === "sent") return { label: "Sent", icon: "checkmark-circle-outline" as const,
    detail: "Delivery not confirmed." + (active ? " Checking automatically." : "") + problem };
  if (s.status === "accepted") return { label: "Submitted", icon: "cloud-upload-outline" as const,
    detail: (active ? "Awaiting delivery confirmation." : "Delivery unconfirmed.") + problem };
  return { label: "Submission unconfirmed", icon: "help-circle-outline" as const, detail: "It may have been sent. No automatic resend." };
}

export function ageLabel(iso: string | null, now = Date.now()): string {
  if (!iso) return "Not checked yet";
  const seconds = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
  if (seconds < 60) return `${seconds} ${seconds === 1 ? "second" : "seconds"} ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
}

export function isSosRecord(value: unknown): value is SosRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as SosRecord;
  const timestamp = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value));
  const nullableTime = (value: unknown) => value === null || timestamp(value);
  const submission = (summary: Submission | null) => {
    if (!summary || !Object.prototype.hasOwnProperty.call(submissionLabel, summary.status) || !timestamp(summary.updatedAt)) return false;
    const d = summary.delivery;
    return d == null || (["pending", "sent", "delivered", "failed", "unknown"].includes(d.status) &&
      ["active", "complete", "timed_out", "unavailable"].includes(d.tracking) && timestamp(d.acceptedAt) && timestamp(d.expiresAt) &&
      nullableTime(d.observedAt) && nullableTime(d.lastAttemptAt) && nullableTime(d.lastCheckedAt) &&
      (d.lastCheckError === null || typeof d.lastCheckError === "string") && (d.failureCode === null || typeof d.failureCode === "string"));
  };
  const job = record.statusRefresh;
  if (job && (!["idle", "pending", "complete", "partial", "unavailable"].includes(job.state) ||
    !nullableTime(job.requestedAt) || !nullableTime(job.expiresAt) || !nullableTime(job.nextAllowedAt))) return false;
  return typeof record.sosId === "string" && typeof record.requestId === "string" &&
    ["active", "ended"].includes(record.status) && Array.isArray(record.recipients) &&
    record.recipients.every((r) => r && typeof r.contactId === "string" && typeof r.name === "string" &&
      typeof r.phone === "string" && submission(r.initial) && (r.ended === null || submission(r.ended)));
}
