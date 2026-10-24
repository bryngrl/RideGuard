export type SubmissionStatus = "queued" | "sending" | "accepted" | "failed" | "unknown" | "cancelled";
export type Submission = { status: SubmissionStatus; updatedAt: string; errorCode?: string };
export type SosLocation = { latitude: number; longitude: number; capturedAt: string; accuracyMeters: number | null };
export type SosInput = { requestId: string; alertId?: string; location: SosLocation | null };
export type SosRecord = {
  sosId: string; requestId: string; alertId: string | null; status: "active" | "ended";
  createdAt: string; endedAt: string | null; location: SosLocation | null;
  recipients: { contactId: string; name: string; phone: string; initial: Submission; ended: Submission | null }[];
};
export type Recovery = { uid: string; requestId: string; body: SosInput | null; sosId: string | null; stopPending: boolean };

export function hasPending(record: SosRecord | null): boolean {
  return !!record?.recipients.some((r) => [r.initial, r.ended].some((s) => s?.status === "queued" || s?.status === "sending"));
}

export const submissionLabel: Record<SubmissionStatus, string> = {
  queued: "Queued", sending: "Submitting", accepted: "Submitted to SMS provider",
  failed: "Failed", unknown: "Submission could not be confirmed", cancelled: "Cancelled",
};

export function isSosRecord(value: unknown): value is SosRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as SosRecord;
  const submission = (summary: Submission | null) => !!summary &&
    Object.prototype.hasOwnProperty.call(submissionLabel, summary.status) && typeof summary.updatedAt === "string";
  return typeof record.sosId === "string" && typeof record.requestId === "string" &&
    ["active", "ended"].includes(record.status) && Array.isArray(record.recipients) &&
    record.recipients.every((r) => r && typeof r.contactId === "string" && typeof r.name === "string" &&
      typeof r.phone === "string" && submission(r.initial) && (r.ended === null || submission(r.ended)));
}
