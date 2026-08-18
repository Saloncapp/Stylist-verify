import { z } from "zod";

export const SALON_TYPES = ["Unisex", "Men", "Women"] as const;

export type SalonType = (typeof SALON_TYPES)[number];

export const salonTypeSchema = z.enum(SALON_TYPES, {
  message: "Select a valid salon type",
});

export const DEFAULT_SALON_TYPE: SalonType = "Unisex";

const CURRENT_YEAR = new Date().getFullYear();
export const MIN_ESTABLISHMENT_YEAR = 1900;
export const MAX_ESTABLISHMENT_YEAR = CURRENT_YEAR;

export function normalizeOptionalUrl(value?: string | null): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const optionalSalonAddressSchema = z
  .string()
  .trim()
  .max(500, "Address must be under 500 characters")
  .optional()
  .or(z.literal(""));

export const optionalHttpUrlSchema = z
  .string()
  .trim()
  .max(2000, "URL is too long")
  .refine((val) => {
    if (!val) return true;
    try {
      new URL(normalizeOptionalUrl(val));
      return true;
    } catch {
      return false;
    }
  }, "Enter a valid URL")
  .optional()
  .or(z.literal(""));

export const optionalEstablishmentYearSchema = z
  .string()
  .trim()
  .refine((val) => {
    if (!val) return true;
    if (!/^\d{4}$/.test(val)) return false;
    const year = Number(val);
    return year >= MIN_ESTABLISHMENT_YEAR && year <= MAX_ESTABLISHMENT_YEAR;
  }, `Enter a year between 1900 and ${CURRENT_YEAR}`)
  .optional()
  .or(z.literal(""));

function optionalDomainUrlSchema(domains: string[], message: string) {
  return z
    .string()
    .trim()
    .max(2000, "URL is too long")
    .refine((val) => {
      if (!val) return true;
      try {
        const hostname = new URL(normalizeOptionalUrl(val)).hostname.toLowerCase();
        return domains.some(
          (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
        );
      } catch {
        return false;
      }
    }, message)
    .optional()
    .or(z.literal(""));
}

export const optionalInstagramUrlSchema = optionalDomainUrlSchema(
  ["instagram.com"],
  "Enter a valid Instagram URL"
);

export const optionalFacebookUrlSchema = optionalDomainUrlSchema(
  ["facebook.com", "fb.com", "fb.me"],
  "Enter a valid Facebook URL"
);

export const optionalYoutubeUrlSchema = optionalDomainUrlSchema(
  ["youtube.com", "youtu.be"],
  "Enter a valid YouTube URL"
);

export const optionalWhatsappNumberSchema = z
  .string()
  .trim()
  .refine(
    (val) => !val || /^[6-9]\d{9}$/.test(val),
    "Enter a valid 10-digit WhatsApp number"
  )
  .optional()
  .or(z.literal(""));

export function parseEstablishmentYear(
  value?: string | null
): number | undefined {
  if (!value || !/^\d{4}$/.test(value.trim())) return undefined;
  const year = Number(value.trim());
  if (
    year < MIN_ESTABLISHMENT_YEAR ||
    year > MAX_ESTABLISHMENT_YEAR
  ) {
    return undefined;
  }
  return year;
}

export function whatsappContactUrl(number?: string | null): string {
  const trimmed = number?.trim() ?? "";
  if (!/^[6-9]\d{9}$/.test(trimmed)) return "";
  return `https://wa.me/91${trimmed}`;
}
