/** The value kept by forms is always unformatted; separators belong to the UI. */
export type InputFormat = { normalize: (text: string) => string; format: (raw: string) => string; count?: (text: string) => number };

/** Reconcile a native edit with the rendered separators and its data-character caret. */
export function formatInputEdit(old: string, next: string, inputFormat: InputFormat) {
  const count = inputFormat.count ?? ((text: string) => inputFormat.normalize(text).length);
  let start = 0;
  while (start < old.length && start < next.length && old[start] === next[start]) start++;
  let oldEnd = old.length, nextEnd = next.length;
  while (oldEnd > start && nextEnd > start && old[oldEnd - 1] === next[nextEnd - 1]) { oldEnd--; nextEnd--; }
  let raw = inputFormat.normalize(next);
  let rawBefore = count(next.slice(0, nextEnd));
  if (next.length < old.length && raw === inputFormat.normalize(old) && oldEnd > start) {
    const beforeCount = count(old.slice(0, oldEnd));
    if (beforeCount > 0) {
      const index = beforeCount - 1;
      raw = raw.slice(0, index) + raw.slice(index + 1);
      rawBefore = index;
    }
  }
  const formatted = inputFormat.format(raw);
  let cursor = 0;
  while (cursor < formatted.length && count(formatted.slice(0, cursor)) < rawBefore) cursor++;
  while (cursor < formatted.length && count(formatted.slice(0, cursor + 1)) === rawBefore) cursor++;
  return { raw, formatted, cursor };
}

export const nationalMobile = (text: string) => {
  const digits = text.replace(/\D/g, "");
  const withoutCountry = digits.startsWith("63") && digits.length > 10 ? digits.slice(2) : digits;
  return (withoutCountry.startsWith("0") ? withoutCountry.slice(1) : withoutCountry).slice(0, 10);
};

export const localMobile = (text: string) => {
  const digits = text.replace(/\D/g, "");
  if (digits.startsWith("63") && digits.length > 11) return `0${digits.slice(2, 12)}`;
  return digits.slice(0, 11);
};

export const formatNationalMobile = (raw: string) => {
  const digits = raw.slice(0, 10);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)].filter(Boolean).join(" ");
};

export const formatLocalMobile = (raw: string) => {
  const digits = raw.slice(0, 11);
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7)].filter(Boolean).join(" ");
};

export const validNationalMobile = (raw: string) => /^9\d{9}$/.test(raw);
export const validLocalMobile = (raw: string) => /^09\d{9}$/.test(raw);

// Device IDs have three letters, three digits, then three letters.
// The first group identifies the device but is not restricted to CAM or BUT.
const deviceId = (text: string) => text.toUpperCase().replace(/-/g, "");
const formatDeviceId = (raw: string) => {
  if (raw.length < 3) return raw;
  if (raw.length === 3) return `${raw}-`;
  if (raw.length < 6) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
  if (raw.length === 6) return `${raw.slice(0, 3)}-${raw.slice(3)}-`;
  return `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
};
export const cameraId = deviceId;
export const formatCameraId = formatDeviceId;
export const validCameraId = (raw: string) => /^[A-Z]{3}\d{3}[A-Z]{3}$/.test(raw);
export const buttonId = deviceId;
export const formatButtonId = formatDeviceId;
export const validButtonId = validCameraId;

// The backend accepts a plate string without publishing a vehicle-class schema.
// Preserve the user's separator without inventing a class-specific mask.
export const plateInput = (text: string) => text.toUpperCase().replace(/[^A-Z0-9 -]/g, "").replace(/ {2,}/g, " ").replace(/-{2,}/g, "-");
export const validPlateInput = (text: string) => /[A-Z0-9]/.test(text) && /^[A-Z0-9][A-Z0-9 -]*[A-Z0-9]$/.test(text.trim());
