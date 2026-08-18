import {
  getAadhaarFromRecord,
  hashAadhaar,
  maskAadhaar,
} from "@/lib/aadhaar-crypto";
import { DEFAULT_SALON_TYPE } from "@/lib/salon-constants";
import {
  DEFAULT_EMPLOYMENT_TYPE,
  DEFAULT_STYLIST_ROLE,
} from "@/lib/employment-constants";
import { maskMobileNumber, maskStylistDisplayName } from "@/lib/mask";
import { formatPreviewExperience } from "@/lib/employment-duration";
import {
  calculateCareerPerformanceRating,
  calculateOverallPerformanceRating,
} from "@/lib/performance-ratings";
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
  maskedMobile: string;
  maskedAadhaar: string;
  level: StylistLevel;
  status: StylistStatus;
  photoUrl: string;
  employmentHistory: VerificationEmploymentEntry[];
}

function sortByJoiningDate(records: IStylist[]): IStylist[] {
  return [...records].sort(
    (a, b) =>
      new Date(a.joiningDate).getTime() - new Date(b.joiningDate).getTime()
  );
}

function getDisplayMeta(records: IStylist[]) {
  const sorted = sortByJoiningDate(records);
  const latest = sorted[sorted.length - 1];
  const activeRecord =
    [...sorted].reverse().find((r) => r.status === "Active") ?? latest;

  const uniqueNames = [...new Set(sorted.map((r) => r.name))];
  const displayName =
    uniqueNames.length > 1
      ? `${uniqueNames[0]} (+${uniqueNames.length - 1} other name${uniqueNames.length > 2 ? "s" : ""})`
      : latest.name;

  return { sorted, latest, activeRecord, displayName };
}

function getLatestHistory(record: IStylist) {
  return record.employmentHistory.length > 0
    ? record.employmentHistory[record.employmentHistory.length - 1]
    : undefined;
}

function pickSalonField(
  recordValue?: string,
  historyValue?: string
): string | undefined {
  return recordValue || historyValue || undefined;
}

function pickPerformanceNumber(
  recordValue?: number,
  historyValue?: number
): number | undefined {
  return recordValue ?? historyValue ?? undefined;
}

function pickPerformanceFields(record: IStylist) {
  const latestHistory = getLatestHistory(record);

  return {
    performanceSummary: pickSalonField(
      record.performanceSummary,
      latestHistory?.performanceSummary
    ),
    managerFeedback: pickSalonField(
      record.managerFeedback,
      latestHistory?.managerFeedback
    ),
    overallExperienceRating: pickPerformanceNumber(
      record.overallExperienceRating,
      latestHistory?.overallExperienceRating
    ),
    technicalSkillRating: pickPerformanceNumber(
      record.technicalSkillRating,
      latestHistory?.technicalSkillRating
    ),
    customerHandlingRating: pickPerformanceNumber(
      record.customerHandlingRating,
      latestHistory?.customerHandlingRating
    ),
    overallPerformanceRating: pickPerformanceNumber(
      record.overallPerformanceRating,
      latestHistory?.overallPerformanceRating
    ),
    specialistServices: record.specialistServices?.length
      ? record.specialistServices
      : latestHistory?.specialistServices?.length
        ? latestHistory.specialistServices
        : undefined,
  };
}

function pickSalonIdentityFields(record: IStylist) {
  const latestHistory = getLatestHistory(record);

  return {
    salonAddress: pickSalonField(
      record.salonAddress,
      latestHistory?.salonAddress
    ),
    salonEmail: pickSalonField(record.salonEmail, latestHistory?.salonEmail),
    salonNumber: pickSalonField(record.salonNumber, latestHistory?.salonNumber),
    googleMapsLocation: pickSalonField(
      record.googleMapsLocation,
      latestHistory?.googleMapsLocation
    ),
    websiteUrl: pickSalonField(record.websiteUrl, latestHistory?.websiteUrl),
    instagramUrl: pickSalonField(
      record.instagramUrl,
      latestHistory?.instagramUrl
    ),
    facebookUrl: pickSalonField(record.facebookUrl, latestHistory?.facebookUrl),
    whatsappNumber: pickSalonField(
      record.whatsappNumber,
      latestHistory?.whatsappNumber
    ),
    youtubeUrl: pickSalonField(record.youtubeUrl, latestHistory?.youtubeUrl),
    establishmentYear:
      record.establishmentYear || latestHistory?.establishmentYear || undefined,
  };
}

/** One employment entry per salon enrollment, using that salon's registered details */
function buildSalonEmploymentEntry(
  record: IStylist
): VerificationEmploymentEntry {
  const latestHistory = getLatestHistory(record);
  const salonFields = pickSalonIdentityFields(record);
  const performanceFields = pickPerformanceFields(record);
  const overallPerformanceRating =
    performanceFields.overallPerformanceRating ??
    calculateOverallPerformanceRating({
      overallExperienceRating: performanceFields.overallExperienceRating,
      technicalSkillRating: performanceFields.technicalSkillRating,
      customerHandlingRating: performanceFields.customerHandlingRating,
    });

  return {
    status: record.status,
    remark: latestHistory?.remark,
    salonId: record.salonId.toString(),
    salonName: record.salonName,
    salonLogoUrl: record.salonLogoUrl || undefined,
    salonType: record.salonType ?? DEFAULT_SALON_TYPE,
    ...salonFields,
    level: record.level,
    role: record.role ?? DEFAULT_STYLIST_ROLE,
    employmentType: record.employmentType ?? DEFAULT_EMPLOYMENT_TYPE,
    performanceSummary: performanceFields.performanceSummary,
    managerFeedback: performanceFields.managerFeedback,
    overallExperienceRating: performanceFields.overallExperienceRating,
    technicalSkillRating: performanceFields.technicalSkillRating,
    customerHandlingRating: performanceFields.customerHandlingRating,
    overallPerformanceRating,
    specialistServices: performanceFields.specialistServices,
    experienceCertificateUrl:
      record.experienceCertificateUrl ||
      latestHistory?.experienceCertificateUrl ||
      undefined,
    relievingLetterUrl:
      record.relievingLetterUrl ||
      latestHistory?.relievingLetterUrl ||
      undefined,
    joiningDate: record.joiningDate.toISOString(),
    leavingDate: record.leavingDate?.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    stylistName: record.name,
    maskedMobile: maskMobileNumber(record.mobileNumber),
  };
}

function buildPrivateSalonEmploymentEntry(
  record: IStylist
): VerificationEmploymentPrivateEntry {
  const latestHistory = getLatestHistory(record);
  const salonFields = pickSalonIdentityFields(record);
  const performanceFields = pickPerformanceFields(record);
  const overallPerformanceRating =
    performanceFields.overallPerformanceRating ??
    calculateOverallPerformanceRating({
      overallExperienceRating: performanceFields.overallExperienceRating,
      technicalSkillRating: performanceFields.technicalSkillRating,
      customerHandlingRating: performanceFields.customerHandlingRating,
    });

  return {
    status: record.status,
    remark: latestHistory?.remark,
    salonId: record.salonId.toString(),
    salonName: record.salonName,
    salonLogoUrl: record.salonLogoUrl || undefined,
    salonType: record.salonType ?? DEFAULT_SALON_TYPE,
    ...salonFields,
    level: record.level,
    role: record.role ?? DEFAULT_STYLIST_ROLE,
    employmentType: record.employmentType ?? DEFAULT_EMPLOYMENT_TYPE,
    performanceSummary: performanceFields.performanceSummary,
    managerFeedback: performanceFields.managerFeedback,
    overallExperienceRating: performanceFields.overallExperienceRating,
    technicalSkillRating: performanceFields.technicalSkillRating,
    customerHandlingRating: performanceFields.customerHandlingRating,
    overallPerformanceRating,
    specialistServices: performanceFields.specialistServices,
    experienceCertificateUrl:
      record.experienceCertificateUrl ||
      latestHistory?.experienceCertificateUrl ||
      undefined,
    relievingLetterUrl:
      record.relievingLetterUrl ||
      latestHistory?.relievingLetterUrl ||
      undefined,
    joiningDate: record.joiningDate.toISOString(),
    leavingDate: record.leavingDate?.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    stylistName: record.name,
    mobileNumber: record.mobileNumber,
  };
}

function collapseBySalon<T extends { salonId: string; joiningDate?: string; updatedAt: string }>(
  entries: T[]
): T[] {
  const bySalon = new Map<string, T>();

  for (const entry of entries) {
    const existing = bySalon.get(entry.salonId);
    if (!existing) {
      bySalon.set(entry.salonId, entry);
      continue;
    }

    const entryTime = new Date(entry.joiningDate ?? entry.updatedAt).getTime();
    const existingTime = new Date(
      existing.joiningDate ?? existing.updatedAt
    ).getTime();
    if (entryTime >= existingTime) {
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
  return collapseBySalon(records.map(buildSalonEmploymentEntry));
}

function buildPrivateEmploymentHistory(
  records: IStylist[]
): VerificationEmploymentPrivateEntry[] {
  return collapseBySalon(records.map(buildPrivateSalonEmploymentEntry));
}

/** Group salon employment records by person (same Aadhaar across salons) */
export function groupRecordsByAadhaar(records: IStylist[]): IStylist[][] {
  const map = new Map<string, IStylist[]>();

  for (const record of records) {
    const key = getStablePersonKey(record);
    const group = map.get(key) ?? [];
    group.push(record);
    map.set(key, group);
  }

  return Array.from(map.values()).map((group) =>
    group.sort(
      (a, b) =>
        new Date(a.joiningDate).getTime() - new Date(b.joiningDate).getTime()
    )
  );
}

function getStablePersonKey(record: IStylist): string {
  try {
    const digits = getAadhaarFromRecord(record).replace(/\D/g, "");
    if (digits.length === 12) return digits;
  } catch {
    // fall through to hash / id
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
  const { sorted, activeRecord, latest } = getDisplayMeta(records);
  const uniqueSalonCount = new Set(
    sorted.map((record) => record.salonId.toString())
  ).size;
  const role = activeRecord.role ?? DEFAULT_STYLIST_ROLE;
  const publicRole = role === "Stylist" ? "Professional Stylist" : role;

  return {
    displayName: maskStylistDisplayName(latest.name),
    role: publicRole,
    experienceLabel: formatPreviewExperience(sorted),
    employmentCount: uniqueSalonCount,
    performanceRating: calculateCareerPerformanceRating(sorted),
  };
}

/** Build one verification result from all salon records for the same person */
export function buildVerifiedStylistFromRecords(
  records: IStylist[]
): VerifiedStylist {
  const { sorted, latest, activeRecord, displayName } =
    getDisplayMeta(records);
  const aadhaarPlain = getAadhaarFromRecord(latest);

  return {
    name: displayName,
    maskedMobile: maskMobileNumber(latest.mobileNumber),
    maskedAadhaar: maskAadhaar(aadhaarPlain),
    level: activeRecord.level,
    status: activeRecord.status,
    photoUrl: latest.photoUrl ?? "",
    employmentHistory: buildEmploymentHistory(sorted),
  };
}

/** Build private (authenticated) verification result with full mobile/address */
export function buildPrivateVerifiedStylistFromRecords(
  records: IStylist[]
): VerifiedStylistPrivateResult {
  const { sorted, latest, activeRecord, displayName } =
    getDisplayMeta(records);
  const aadhaarPlain = getAadhaarFromRecord(latest);

  return {
    name: displayName,
    mobileNumber: latest.mobileNumber,
    aadhaarMasked: maskAadhaar(aadhaarPlain),
    address: latest.address ?? "",
    level: activeRecord.level,
    status: activeRecord.status,
    photoUrl: latest.photoUrl ?? "",
    employmentHistory: buildPrivateEmploymentHistory(sorted),
  };
}
