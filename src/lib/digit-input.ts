import type { ChangeEvent } from "react";

/** Strip non-digits and cap length for numeric ID fields */
export function sanitizeDigits(value: string, maxLength: number): string {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function handleDigitInput(
  e: ChangeEvent<HTMLInputElement>,
  maxLength: number
) {
  e.target.value = sanitizeDigits(e.target.value, maxLength);
}
