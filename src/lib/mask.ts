/** Mask the last 5 digits of a 10-digit mobile number, e.g. 9876543210 → 98765***** */
export function maskMobileNumber(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length <= 5) return digits;
  return digits.slice(0, 5) + "*".repeat(digits.length - 5);
}
