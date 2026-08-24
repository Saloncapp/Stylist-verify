import type { Types } from "mongoose";
import type { IEmploymentHistoryEntry, IStylist } from "@/models/Stylist";
import type { StylistInput } from "@/lib/validations";
import { getEntrySalonSnapshot } from "@/lib/salon-snapshot";

export function salonObjectIdEquals(
  a: Types.ObjectId | string,
  b: Types.ObjectId | string
): boolean {
  return a.toString() === b.toString();
}

export function stylistAccessibleBySalonQuery(salonId: string) {
  return { "employmentHistory.salonId": salonId };
}

export function findStylistForSalonQuery(id: string, salonId: string) {
  return {
    _id: id,
    ...stylistAccessibleBySalonQuery(salonId),
  };
}

function entryTime(entry: IEmploymentHistoryEntry): number {
  return new Date(entry.joiningDate ?? entry.updatedAt).getTime();
}

export function getSalonEmploymentEntries(
  stylist: IStylist,
  salonId: string
): IEmploymentHistoryEntry[] {
  return stylist.employmentHistory.filter((entry) =>
    salonObjectIdEquals(entry.salonId, salonId)
  );
}

export function getCurrentSalonEmployment(
  stylist: IStylist,
  salonId: string
): IEmploymentHistoryEntry | undefined {
  const entries = getSalonEmploymentEntries(stylist, salonId);
  if (entries.length === 0) return undefined;
  return (
    [...entries].reverse().find((entry) => entry.status === "Active") ??
    [...entries].sort((a, b) => entryTime(b) - entryTime(a))[0]
  );
}

export function hasActiveEmploymentAtSalon(
  stylist: IStylist,
  salonId: string
): boolean {
  return getSalonEmploymentEntries(stylist, salonId).some(
    (entry) => entry.status === "Active" || entry.status == null
  );
}

export function applyIdentityFields(
  stylist: IStylist,
  data: Pick<
    StylistInput,
    "name" | "mobileNumber" | "address" | "photoUrl"
  >
) {
  stylist.name = data.name;
  stylist.mobileNumber = data.mobileNumber;
  stylist.address = data.address ?? "";
  stylist.photoUrl = data.photoUrl ?? "";
}

export function applySalonEmploymentFields(
  entry: IEmploymentHistoryEntry,
  data: Pick<StylistInput, "level" | "role" | "employmentType">
) {
  if (data.level) entry.level = data.level;
  if (data.role) entry.role = data.role;
  if (data.employmentType) entry.employmentType = data.employmentType;
}

export function updateEntrySalonSnapshot(
  entry: IEmploymentHistoryEntry,
  snapshot: IEmploymentHistoryEntry["salonSnapshot"]
) {
  entry.salonSnapshot = snapshot;
}

export { getEntrySalonSnapshot };
