/** Mask mobile for browse contexts, e.g. 9876543210 → ******3210 */
export function maskMobileNumber(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length <= 4) return "*".repeat(digits.length);
  return "*".repeat(digits.length - 4) + digits.slice(-4);
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
