import type {
  EmploymentHistoryEntry,
  SalonVisitProfile,
  VerificationEmploymentEntry,
  VerificationEmploymentPrivateEntry,
} from "@/types";
import { DEFAULT_SALON_TYPE } from "@/lib/salon-constants";

type VisitSource =
  | EmploymentHistoryEntry
  | VerificationEmploymentEntry
  | VerificationEmploymentPrivateEntry;

function pickString(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

function pickNumber(...values: Array<number | undefined>): number | undefined {
  for (const value of values) {
    if (value != null) return value;
  }
  return undefined;
}

export function employmentEntryToSalonVisit(entry: VisitSource): SalonVisitProfile {
  return {
    salonName: entry.salonName,
    salonLogoUrl: entry.salonLogoUrl,
    salonType: entry.salonType ?? DEFAULT_SALON_TYPE,
    salonAddress: pickString(entry.salonAddress),
    salonEmail: pickString(entry.salonEmail),
    salonNumber: pickString(entry.salonNumber),
    googleMapsLocation: pickString(entry.googleMapsLocation),
    websiteUrl: pickString(entry.websiteUrl),
    instagramUrl: pickString(entry.instagramUrl),
    facebookUrl: pickString(entry.facebookUrl),
    whatsappNumber: pickString(entry.whatsappNumber),
    youtubeUrl: pickString(entry.youtubeUrl),
    establishmentYear: pickNumber(entry.establishmentYear),
  };
}
