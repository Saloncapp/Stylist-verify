import { maskMobileNumber } from "@/lib/mask";
import type { IStylist } from "@/models/Stylist";
import type {
  StylistLevel,
  StylistStatus,
  VerificationEmploymentEntry,
} from "@/types";

export interface VerifiedStylist {
  name: string;
  maskedMobile: string;
  level: StylistLevel;
  status: StylistStatus;
  photoUrl: string;
  aadhaarNumber: string;
  employmentHistory: VerificationEmploymentEntry[];
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

/** Group salon employment records by Aadhaar (one person may appear at multiple salons) */
export function groupRecordsByAadhaar(records: IStylist[]): IStylist[][] {
  const map = new Map<string, IStylist[]>();

  for (const record of records) {
    const group = map.get(record.aadhaarNumber) ?? [];
    group.push(record);
    map.set(record.aadhaarNumber, group);
  }

  return Array.from(map.values()).map((group) =>
    group.sort(
      (a, b) =>
        new Date(a.joiningDate).getTime() - new Date(b.joiningDate).getTime()
    )
  );
}

/** Build one verification result from all salon records for the same person */
export function buildVerifiedStylistFromRecords(
  records: IStylist[]
): VerifiedStylist {
  const sorted = [...records].sort(
    (a, b) =>
      new Date(a.joiningDate).getTime() - new Date(b.joiningDate).getTime()
  );

  const latest = sorted[sorted.length - 1];
  const activeRecord =
    [...sorted].reverse().find((r) => r.status === "Active") ?? latest;

  const uniqueNames = [...new Set(sorted.map((r) => r.name))];
  const displayName =
    uniqueNames.length > 1
      ? `${uniqueNames[0]} (+${uniqueNames.length - 1} other name${uniqueNames.length > 2 ? "s" : ""})`
      : latest.name;

  return {
    name: displayName,
    maskedMobile: maskMobileNumber(latest.mobileNumber),
    level: activeRecord.level,
    status: activeRecord.status,
    photoUrl: latest.photoUrl,
    aadhaarNumber: latest.aadhaarNumber,
    employmentHistory: buildEmploymentHistory(sorted),
  };
}
