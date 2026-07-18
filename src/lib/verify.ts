import {
  getAadhaarFromRecord,
  getAadhaarGroupKey,
  hashAadhaar,
  maskAadhaar,
} from "@/lib/aadhaar-crypto";
import { maskMobileNumber } from "@/lib/mask";
import type { IStylist } from "@/models/Stylist";
import type {
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

/** One employment entry per salon enrollment, using that salon's registered details */
function buildSalonEmploymentEntry(
  record: IStylist
): VerificationEmploymentEntry {
  const latestHistory =
    record.employmentHistory.length > 0
      ? record.employmentHistory[record.employmentHistory.length - 1]
      : undefined;

  return {
    status: record.status,
    remark: latestHistory?.remark,
    salonId: record.salonId.toString(),
    salonName: record.salonName,
    level: record.level,
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
  const latestHistory =
    record.employmentHistory.length > 0
      ? record.employmentHistory[record.employmentHistory.length - 1]
      : undefined;

  return {
    status: record.status,
    remark: latestHistory?.remark,
    salonId: record.salonId.toString(),
    salonName: record.salonName,
    level: record.level,
    joiningDate: record.joiningDate.toISOString(),
    leavingDate: record.leavingDate?.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    stylistName: record.name,
    mobileNumber: record.mobileNumber,
  };
}

function buildEmploymentHistory(
  records: IStylist[]
): VerificationEmploymentEntry[] {
  return records
    .map(buildSalonEmploymentEntry)
    .sort(
      (a, b) =>
        new Date(b.joiningDate ?? b.updatedAt).getTime() -
        new Date(a.joiningDate ?? a.updatedAt).getTime()
    );
}

function buildPrivateEmploymentHistory(
  records: IStylist[]
): VerificationEmploymentPrivateEntry[] {
  return records
    .map(buildPrivateSalonEmploymentEntry)
    .sort(
      (a, b) =>
        new Date(b.joiningDate ?? b.updatedAt).getTime() -
        new Date(a.joiningDate ?? a.updatedAt).getTime()
    );
}

/** Group salon employment records by Aadhaar (one person may appear at multiple salons) */
export function groupRecordsByAadhaar(records: IStylist[]): IStylist[][] {
  const map = new Map<string, IStylist[]>();

  for (const record of records) {
    const key = getAadhaarGroupKey(record);
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
