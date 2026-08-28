/** Normalize Indian mobile numbers to a 10-digit string, or null if invalid. */
export function normalizeIndianMobile(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) return digits;
  if (
    digits.length === 12 &&
    digits.startsWith("91") &&
    /^[6-9]\d{9}$/.test(digits.slice(2))
  ) {
    return digits.slice(2);
  }
  if (
    digits.length === 11 &&
    digits.startsWith("0") &&
    /^[6-9]\d{9}$/.test(digits.slice(1))
  ) {
    return digits.slice(1);
  }
  return null;
}

export function toE164Indian(phone: string): string {
  const normalized = normalizeIndianMobile(phone);
  if (!normalized) {
    throw new Error("Invalid phone number. Use a valid 10-digit Indian mobile.");
  }
  return `+91${normalized}`;
}
