export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("63")) {
    return digits.slice(2);
  }

  if (digits.startsWith("0")) {
    return digits.slice(1);
  }

  return digits;
}

export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);

  return /^9\d{9}$/.test(normalized);
}

export function toE164(phone: string): string {
  const normalized = normalizePhoneNumber(phone);

  return `+63${normalized}`;
}