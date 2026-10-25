// Frozen pre-delivery mobile validator, copied from types.ts on 2026-10-25.
// Keep this independent of the current validator to check existing-client parsing.
exports.isSosRecord = function (value) {
  if (!value || typeof value !== "object") return false;
  const labels = { queued: 1, sending: 1, accepted: 1, failed: 1, unknown: 1, cancelled: 1 };
  const submission = summary => !!summary && Object.prototype.hasOwnProperty.call(labels, summary.status) && typeof summary.updatedAt === "string";
  return typeof value.sosId === "string" && typeof value.requestId === "string" &&
    ["active", "ended"].includes(value.status) && Array.isArray(value.recipients) &&
    value.recipients.every(r => r && typeof r.contactId === "string" && typeof r.name === "string" &&
      typeof r.phone === "string" && submission(r.initial) && (r.ended === null || submission(r.ended)));
};
