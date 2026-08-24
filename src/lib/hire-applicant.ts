import mongoose from "mongoose";
import type { IStylist } from "@/models/Stylist";
import type { StylistCreateInput } from "@/lib/validations";
import { hashAadhaar } from "@/lib/aadhaar-crypto";
import { nextEmployeeId } from "@/lib/employee-id";
import {
  applyIdentityFields,
  hasActiveEmploymentAtSalon,
} from "@/lib/stylist-employment";
import { buildEmploymentEntry } from "@/lib/stylist-employment-write";
import { salonSnapshotFromSalon } from "@/lib/salon-sync";
import {
  DEFAULT_EMPLOYMENT_TYPE,
  DEFAULT_STYLIST_ROLE,
  type EmploymentType,
  type StylistRole,
} from "@/lib/employment-constants";
import Application from "@/models/Application";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

function workingFromDate(month?: number, year?: number) {
  if (month == null || year == null) return new Date();
  return new Date(year, month - 1, 1);
}

function isStylistRole(value: string | undefined): value is StylistRole {
  return (
    value === "Junior Stylist" ||
    value === "Stylist" ||
    value === "Senior Stylist"
  );
}

function isEmploymentType(value: string | undefined): value is EmploymentType {
  return (
    value === "Full-time" ||
    value === "Part-time" ||
    value === "Contract" ||
    value === "Temporary"
  );
}

export function hasEmploymentForApplication(
  stylist: Pick<IStylist, "employmentHistory">,
  applicationId: string
): boolean {
  return stylist.employmentHistory.some(
    (entry) => entry.applicationId?.toString() === applicationId
  );
}

export class HireApplicantError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "HireApplicantError";
  }
}

/** Hire an applicant: employment entry + Hired status + clear Open to Work. */
export async function hireApplicantFromApplication(input: {
  salonId: string;
  applicationId: string;
  data: StylistCreateInput;
}) {
  const { salonId, applicationId, data } = input;

  const application = await Application.findOne({
    _id: applicationId,
    salonId,
  });

  if (!application) {
    throw new HireApplicantError("Application not found", 404);
  }

  if (application.status === "Hired") {
    throw new HireApplicantError("This applicant has already been hired", 409);
  }

  if (application.status !== "Interested") {
    throw new HireApplicantError(
      `Cannot hire an application with status ${application.status}`,
      400
    );
  }

  const [salon, stylist] = await Promise.all([
    Salon.findById(salonId),
    Stylist.findById(application.stylistId),
  ]);

  if (!salon) {
    throw new HireApplicantError("Salon not found", 404);
  }

  if (!stylist) {
    throw new HireApplicantError("Stylist profile not found", 404);
  }

  if (stylist._id.toString() !== application.stylistId.toString()) {
    throw new HireApplicantError("Stylist does not match this application", 400);
  }

  const aadhaarHash = hashAadhaar(data.aadhaarNumber);
  const stylistAadhaarMatches =
    stylist.aadhaarHash === aadhaarHash ||
    stylist.aadhaarNumber === data.aadhaarNumber;

  if (!stylistAadhaarMatches) {
    throw new HireApplicantError(
      "Aadhaar does not match the applicant's profile",
      400
    );
  }

  if (hasActiveEmploymentAtSalon(stylist, salonId)) {
    throw new HireApplicantError(
      "This stylist is already registered at your salon",
      409
    );
  }

  if (hasEmploymentForApplication(stylist, applicationId)) {
    throw new HireApplicantError(
      "Employment for this application already exists",
      409
    );
  }

  const phoneTakenBySalon = await Salon.findOne({
    salonNumber: data.mobileNumber,
  });
  if (phoneTakenBySalon) {
    throw new HireApplicantError(
      "This phone number belongs to a salon account and cannot be used for a stylist",
      409
    );
  }

  if (stylist.mobileNumber !== data.mobileNumber) {
    const phoneOwner = await Stylist.findOne({
      mobileNumber: data.mobileNumber,
      _id: { $ne: stylist._id },
    });
    if (phoneOwner) {
      throw new HireApplicantError(
        "This phone number is already linked to another stylist profile",
        409
      );
    }
  }

  const now = new Date();
  const joiningDate = workingFromDate(
    data.workingFromMonth,
    data.workingFromYear
  );
  const snapshot = salonSnapshotFromSalon(salon);
  const jobRole = application.jobSnapshot.role;
  const jobEmploymentType = application.jobSnapshot.employmentType;

  applyIdentityFields(stylist, data);

  if (!stylist.employeeId) {
    stylist.employeeId = await nextEmployeeId();
  }

  const employmentData = {
    ...data,
    status: "Active" as const,
    role:
      data.role ??
      (isStylistRole(jobRole) ? jobRole : DEFAULT_STYLIST_ROLE),
    employmentType:
      data.employmentType ??
      (isEmploymentType(jobEmploymentType)
        ? jobEmploymentType
        : DEFAULT_EMPLOYMENT_TYPE),
  };

  const historyEntry = buildEmploymentEntry({
    salon,
    snapshot,
    data: employmentData,
    now,
    joiningDate,
    employeeId: stylist.employeeId,
    jobId: application.jobId,
    applicationId: new mongoose.Types.ObjectId(applicationId),
  });

  stylist.employmentHistory.push(historyEntry);
  stylist.markModified("employmentHistory");
  stylist.openToWork = false;
  stylist.openToWorkAt = undefined;

  application.status = "Hired";

  await stylist.save();
  await application.save();

  return { application, stylist };
}
