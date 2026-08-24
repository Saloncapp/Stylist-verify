import type { Types } from "mongoose";
import type { IEmploymentHistoryEntry } from "@/models/Stylist";
import type { StylistInput } from "@/lib/validations";
import {
  salonSnapshotFromSalon,
  type SalonDetailsSync,
} from "@/lib/salon-sync";

export function buildEmploymentEntry(input: {
  salon: Parameters<typeof salonSnapshotFromSalon>[0] & { _id: Types.ObjectId };
  snapshot?: SalonDetailsSync;
  data: Pick<
    StylistInput,
    "status" | "remark" | "level" | "role" | "employmentType"
  >;
  now?: Date;
  joiningDate?: Date;
  employeeId?: string;
  jobId?: Types.ObjectId;
  applicationId?: Types.ObjectId;
}): IEmploymentHistoryEntry {
  const now = input.now ?? new Date();
  const salonSnapshot = input.snapshot ?? salonSnapshotFromSalon(input.salon);
  const joiningDate = input.joiningDate ?? now;
  const leaving =
    input.data.status === "Relieved" || input.data.status === "Abscond"
      ? now
      : undefined;

  const entry: IEmploymentHistoryEntry = {
    salonId: input.salon._id,
    salonSnapshot,
    performanceSummary: "",
    managerFeedback: "",
    specialistServices: [],
    experienceCertificateUrl: "",
    relievingLetterUrl: "",
    joiningDate,
    leavingDate: leaving,
    updatedAt: now,
  };
  if (input.employeeId) entry.employeeId = input.employeeId;
  if (input.jobId) entry.jobId = input.jobId;
  if (input.applicationId) entry.applicationId = input.applicationId;
  if (input.data.status) entry.status = input.data.status;
  if (input.data.remark) entry.remark = input.data.remark;
  if (input.data.level) entry.level = input.data.level;
  if (input.data.role) entry.role = input.data.role;
  if (input.data.employmentType) entry.employmentType = input.data.employmentType;
  return entry;
}
