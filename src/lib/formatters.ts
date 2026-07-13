import type { IStylist } from "@/models/Stylist";
import type { StylistRecord, EmploymentHistoryEntry } from "@/types";

export function formatStylist(stylist: IStylist): StylistRecord {
  return {
    id: stylist._id.toString(),
    salonId: stylist.salonId.toString(),
    salonName: stylist.salonName,
    name: stylist.name,
    mobileNumber: stylist.mobileNumber,
    level: stylist.level,
    aadhaarNumber: stylist.aadhaarNumber,
    address: stylist.address,
    photoUrl: stylist.photoUrl,
    status: stylist.status,
    joiningDate: stylist.joiningDate.toISOString(),
    leavingDate: stylist.leavingDate?.toISOString(),
    employmentHistory: stylist.employmentHistory.map(formatHistoryEntry),
    createdAt: stylist.createdAt.toISOString(),
    updatedAt: stylist.updatedAt.toISOString(),
  };
}

export function formatHistoryEntry(
  entry: IStylist["employmentHistory"][number]
): EmploymentHistoryEntry {
  return {
    status: entry.status,
    remark: entry.remark,
    salonId: entry.salonId.toString(),
    salonName: entry.salonName,
    level: entry.level,
    joiningDate: entry.joiningDate?.toISOString(),
    leavingDate: entry.leavingDate?.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}
