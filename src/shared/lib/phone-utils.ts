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

/** Format Philippine mobile numbers for display without changing their stored value. */
export function formatDisplayPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = /^09\d{9}$/.test(digits)
    ? digits
    : /^639\d{9}$/.test(digits)
      ? `0${digits.slice(2)}`
      : /^9\d{9}$/.test(digits)
        ? `0${digits}`
        : null;
  return local ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : phone;
}

export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);

  return /^9\d{9}$/.test(normalized);
}

export function toE164(phone: string): string {
  const normalized = normalizePhoneNumber(phone);

  return `+63${normalized}`;
}
