import {
  getAadhaarFromRecord,
  hashAadhaar,
  maskAadhaar,
} from "@/lib/aadhaar-crypto";
import { DEFAULT_SALON_TYPE } from "@/lib/salon-constants";
import { maskMobileNumber, maskStylistDisplayName } from "@/lib/mask";
import { formatPreviewExperience } from "@/lib/employment-duration";
import {
  calculateCareerPerformanceRating,
  calculateOverallPerformanceRating,
} from "@/lib/performance-ratings";
import { getEntrySalonSnapshot } from "@/lib/salon-snapshot";
import type { IStylist } from "@/models/Stylist";
import type {
  PublicStylistPreview,
  StylistLevel,
  StylistStatus,
  VerificationEmploymentEntry,
  VerificationEmploymentPrivateEntry,
  VerifiedStylistPrivateResult,
} from "@/types";

export interface VerifiedStylist {
  name: string;
  employeeId?: string;
  maskedMobile: string;
  maskedAadhaar: string;
  level?: StylistLevel;
  status?: StylistStatus;
  photoUrl: string;
  employmentHistory: VerificationEmploymentEntry[];
}

function entryTime(entry: {
  joiningDate?: Date;
  updatedAt: Date;
}): number {
  return new Date(entry.joiningDate ?? entry.updatedAt).getTime();
}

function sortHistory(stylist: IStylist) {
  return [...stylist.employmentHistory].sort(
    (a, b) => entryTime(a) - entryTime(b)
  );
}

function getActiveEntry(stylist: IStylist) {
  const history = sortHistory(stylist);
  return (
    [...history].reverse().find((entry) => entry.status === "Active") ??
    history[history.length - 1]
  );
}

function historyToPublicEmployment(
  record: IStylist,
  entry: IStylist["employmentHistory"][number]
): VerificationEmploymentEntry {
  const snapshot = getEntrySalonSnapshot(
    entry as IStylist["employmentHistory"][number] & Record<string, unknown>
  );
  const overallPerformanceRating =
    entry.overallPerformanceRating ??
    calculateOverallPerformanceRating({
      overallExperienceRating: entry.overallExperienceRating,
      technicalSkillRating: entry.technicalSkillRating,
      customerHandlingRating: entry.customerHandlingRating,
    });

  return {
    employeeId: record.employeeId || undefined,
    status: entry.status,
    remark: entry.remark,
    salonId: entry.salonId.toString(),
    salonName: snapshot.salonName,
    salonLogoUrl: snapshot.salonLogoUrl || undefined,
    salonType: snapshot.salonType ?? DEFAULT_SALON_TYPE,
    salonAddress: snapshot.salonAddress || undefined,
    salonEmail: snapshot.salonEmail || undefined,
    salonNumber: snapshot.salonNumber || undefined,
    googleMapsLocation: snapshot.googleMapsLocation || undefined,
    websiteUrl: snapshot.websiteUrl || undefined,
    instagramUrl: snapshot.instagramUrl || undefined,
    facebookUrl: snapshot.facebookUrl || undefined,
    whatsappNumber: snapshot.whatsappNumber || undefined,
    youtubeUrl: snapshot.youtubeUrl || undefined,
    establishmentYear: snapshot.establishmentYear || undefined,
    level: entry.level,
    role: entry.role,
    employmentType: entry.employmentType,
    performanceSummary: entry.performanceSummary || undefined,
    managerFeedback: entry.managerFeedback || undefined,
    overallExperienceRating: entry.overallExperienceRating || undefined,
    technicalSkillRating: entry.technicalSkillRating || undefined,
    customerHandlingRating: entry.customerHandlingRating || undefined,
    overallPerformanceRating,
    specialistServices: entry.specialistServices?.length
      ? entry.specialistServices
      : undefined,
    experienceCertificateUrl: entry.experienceCertificateUrl || undefined,
    relievingLetterUrl: entry.relievingLetterUrl || undefined,
    joiningDate: entry.joiningDate?.toISOString(),
    leavingDate: entry.leavingDate?.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    stylistName: record.name,
    maskedMobile: maskMobileNumber(record.mobileNumber),
  };
}

function historyToPrivateEmployment(
  record: IStylist,
  entry: IStylist["employmentHistory"][number]
): VerificationEmploymentPrivateEntry {
  return {
    ...historyToPublicEmployment(record, entry),
    stylistName: record.name,
    mobileNumber: record.mobileNumber,
  };
}

function collapseBySalon<
  T extends { salonId: string; joiningDate?: string; updatedAt: string },
>(entries: T[]): T[] {
  const bySalon = new Map<string, T>();

  for (const entry of entries) {
    const existing = bySalon.get(entry.salonId);
    if (!existing) {
      bySalon.set(entry.salonId, entry);
      continue;
    }

    const entryTimeValue = new Date(entry.joiningDate ?? entry.updatedAt).getTime();
    const existingTimeValue = new Date(
      existing.joiningDate ?? existing.updatedAt
    ).getTime();
    if (entryTimeValue >= existingTimeValue) {
      bySalon.set(entry.salonId, entry);
    }
  }

  return Array.from(bySalon.values()).sort(
    (a, b) =>
      new Date(b.joiningDate ?? b.updatedAt).getTime() -
      new Date(a.joiningDate ?? a.updatedAt).getTime()
  );
}

function buildEmploymentHistory(
  records: IStylist[]
): VerificationEmploymentEntry[] {
  const entries = records.flatMap((record) =>
    sortHistory(record).map((entry) => historyToPublicEmployment(record, entry))
  );
  return collapseBySalon(entries);
}

function buildPrivateEmploymentHistory(
  records: IStylist[]
): VerificationEmploymentPrivateEntry[] {
  const entries = records.flatMap((record) =>
    sortHistory(record).map((entry) => historyToPrivateEmployment(record, entry))
  );
  return collapseBySalon(entries);
}

/** Group stylist records by person (legacy safety during migration) */
export function groupRecordsByAadhaar(records: IStylist[]): IStylist[][] {
  const map = new Map<string, IStylist[]>();

  for (const record of records) {
    const key = getStablePersonKey(record);
    const group = map.get(key) ?? [];
    group.push(record);
    map.set(key, group);
  }

  return Array.from(map.values());
}

function getStablePersonKey(record: IStylist): string {
  try {
    const digits = getAadhaarFromRecord(record).replace(/\D/g, "");
    if (digits.length === 12) return digits;
  } catch {
    // fall through
  }

  const hash = record.aadhaarHash?.trim();
  if (hash) return `hash:${hash}`;
  return `id:${record._id.toString()}`;
}

/** Build Mongo query for Aadhaar or mobile verification search */
export function buildVerifyQuery(input: {
  aadhaarNumber?: string;
  mobileNumber?: string;
}): Record<string, unknown> | null {
  const { aadhaarNumber, mobileNumber } = input;

  if (aadhaarNumber && /^\d{12}$/.test(aadhaarNumber)) {
    const aadhaarHash = hashAadhaar(aadhaarNumber);
    return { $or: [{ aadhaarHash }, { aadhaarNumber }] };
  }

  if (mobileNumber && /^[6-9]\d{9}$/.test(mobileNumber)) {
    return { mobileNumber };
  }

  return null;
}

/** Privacy-safe preview for logged-out verification searches */
export function buildPublicStylistPreview(
  records: IStylist[]
): PublicStylistPreview {
  const stylist = records[0];
  const history = buildEmploymentHistory(records);
  const uniqueSalonCount = new Set(history.map((entry) => entry.salonId)).size;
  const activeHistory =
    history.find((entry) => entry.status === "Active") ?? history[0];
  const activeEntry = stylist ? getActiveEntry(stylist) : undefined;
  const role = activeHistory?.role ?? activeEntry?.role;
  const publicRole =
    role === "Stylist" ? "Professional Stylist" : role ?? "Professional Stylist";

  return {
    displayName: maskStylistDisplayName(stylist?.name ?? "Stylist"),
    role: publicRole,
    experienceLabel: formatPreviewExperience(history),
    employmentCount: uniqueSalonCount || records.length,
    performanceRating: calculateCareerPerformanceRating(history),
  };
}

/** Build one verification result from stylist profile(s) */
export function buildVerifiedStylistFromRecords(
  records: IStylist[]
): VerifiedStylist {
  const stylist = records[records.length - 1];
  const aadhaarPlain = getAadhaarFromRecord(stylist);
  const history = buildEmploymentHistory(records);
  const activeHistory =
    history.find((entry) => entry.status === "Active") ?? history[0];
  const activeEntry = getActiveEntry(stylist);

  return {
    name: stylist.name,
    employeeId: stylist.employeeId || undefined,
    maskedMobile: maskMobileNumber(stylist.mobileNumber),
    maskedAadhaar: maskAadhaar(aadhaarPlain),
    level: activeHistory?.level ?? activeEntry?.level,
    status: activeHistory?.status ?? activeEntry?.status,
    photoUrl: stylist.photoUrl ?? "",
    employmentHistory: history,
  };
}

/** Build private (authenticated) verification result with full mobile/address */
export function buildPrivateVerifiedStylistFromRecords(
  records: IStylist[]
): VerifiedStylistPrivateResult {
  const stylist = records[records.length - 1];
  const aadhaarPlain = getAadhaarFromRecord(stylist);
  const history = buildPrivateEmploymentHistory(records);
  const activeHistory =
    history.find((entry) => entry.status === "Active") ?? history[0];
  const activeEntry = getActiveEntry(stylist);

  return {
    name: stylist.name,
    employeeId: stylist.employeeId || undefined,
    mobileNumber: stylist.mobileNumber,
    aadhaarMasked: maskAadhaar(aadhaarPlain),
    address: stylist.address ?? "",
    level: activeHistory?.level ?? activeEntry?.level ?? "L1",
    status: activeHistory?.status ?? activeEntry?.status ?? "Active",
    photoUrl: stylist.photoUrl ?? "",
    employmentHistory: history,
  };
}
