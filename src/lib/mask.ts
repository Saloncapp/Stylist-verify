/** Mask the last 5 digits of a 10-digit mobile number, e.g. 9876543210 → 98765***** */
export function maskMobileNumber(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length <= 5) return digits;
  return digits.slice(0, 5) + "*".repeat(digits.length - 5);
}

/** Public preview name: first name + last initial, e.g. Priya Kumar → Priya K. */
export function maskStylistDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Stylist";
  if (parts.length === 1) return parts[0];

  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
}
