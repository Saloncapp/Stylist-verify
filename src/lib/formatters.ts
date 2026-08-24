import { getAadhaarFromRecord, maskAadhaar } from "@/lib/aadhaar-crypto";
import { DEFAULT_SALON_TYPE } from "@/lib/salon-constants";
import { calculateOverallPerformanceRating } from "@/lib/performance-ratings";
import {
  getCurrentSalonEmployment,
  getEntrySalonSnapshot,
} from "@/lib/stylist-employment";
import type { IStylist } from "@/models/Stylist";
import type { StylistRecord, EmploymentHistoryEntry } from "@/types";

export function formatHistoryEntry(
  entry: IStylist["employmentHistory"][number],
  employeeId?: string
): EmploymentHistoryEntry {
  const snapshot = getEntrySalonSnapshot(
    entry as IStylist["employmentHistory"][number] & Record<string, unknown>
  );

  return {
    id: entry._id?.toString(),
    employeeId,
    status: entry.status,
    remark: entry.remark,
    salonId: entry.salonId.toString(),
    salonName: snapshot.salonName,
    salonLogoUrl: snapshot.salonLogoUrl || undefined,
    salonType: snapshot.salonType ?? DEFAULT_SALON_TYPE,
    salonAddress: snapshot.salonAddress || undefined,
    googleMapsLocation: snapshot.googleMapsLocation || undefined,
    websiteUrl: snapshot.websiteUrl || undefined,
    salonEmail: snapshot.salonEmail || undefined,
    salonNumber: snapshot.salonNumber || undefined,
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
    overallPerformanceRating:
      entry.overallPerformanceRating ||
      calculateOverallPerformanceRating({
        overallExperienceRating: entry.overallExperienceRating || undefined,
        technicalSkillRating: entry.technicalSkillRating || undefined,
        customerHandlingRating: entry.customerHandlingRating || undefined,
      }),
    specialistServices: entry.specialistServices?.length
      ? entry.specialistServices
      : undefined,
    experienceCertificateUrl: entry.experienceCertificateUrl || undefined,
    relievingLetterUrl: entry.relievingLetterUrl || undefined,
    joiningDate: entry.joiningDate?.toISOString(),
    leavingDate: entry.leavingDate?.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export function formatStylist(
  stylist: IStylist,
  salonId?: string
): StylistRecord {
  const scoped = salonId
    ? getCurrentSalonEmployment(stylist, salonId)
    : undefined;
  const snapshot = scoped
    ? getEntrySalonSnapshot(
        scoped as IStylist["employmentHistory"][number] & Record<string, unknown>
      )
    : undefined;
  const aadhaarNumber = getAadhaarFromRecord(stylist);
  const employeeId = stylist.employeeId || undefined;

  const performanceSummary = scoped?.performanceSummary || undefined;
  const managerFeedback = scoped?.managerFeedback || undefined;
  const overallExperienceRating = scoped?.overallExperienceRating || undefined;
  const technicalSkillRating = scoped?.technicalSkillRating || undefined;
  const customerHandlingRating = scoped?.customerHandlingRating || undefined;
  const overallPerformanceRating =
    scoped?.overallPerformanceRating ||
    calculateOverallPerformanceRating({
      overallExperienceRating,
      technicalSkillRating,
      customerHandlingRating,
    });
  const specialistServices = scoped?.specialistServices?.length
    ? scoped.specialistServices
    : undefined;
  const experienceCertificateUrl =
    scoped?.experienceCertificateUrl || undefined;
  const relievingLetterUrl = scoped?.relievingLetterUrl || undefined;

  const level = scoped?.level;
  const role = scoped?.role;
  const employmentType = scoped?.employmentType;
  const status = scoped?.status;
  const joiningDate = scoped?.joiningDate
    ? scoped.joiningDate.toISOString()
    : new Date().toISOString();
  const leavingDate = scoped?.leavingDate?.toISOString();

  return {
    id: stylist._id.toString(),
    employeeId,
    salonId: scoped?.salonId.toString() ?? "",
    salonName: snapshot?.salonName ?? "",
    salonLogoUrl: snapshot?.salonLogoUrl || undefined,
    salonType: snapshot?.salonType ?? DEFAULT_SALON_TYPE,
    salonAddress: snapshot?.salonAddress || undefined,
    googleMapsLocation: snapshot?.googleMapsLocation || undefined,
    websiteUrl: snapshot?.websiteUrl || undefined,
    salonEmail: snapshot?.salonEmail || undefined,
    salonNumber: snapshot?.salonNumber || undefined,
    instagramUrl: snapshot?.instagramUrl || undefined,
    facebookUrl: snapshot?.facebookUrl || undefined,
    whatsappNumber: snapshot?.whatsappNumber || undefined,
    youtubeUrl: snapshot?.youtubeUrl || undefined,
    establishmentYear: snapshot?.establishmentYear || undefined,
    name: stylist.name,
    mobileNumber: stylist.mobileNumber,
    level,
    role,
    employmentType,
    performanceSummary,
    managerFeedback,
    overallExperienceRating,
    technicalSkillRating,
    customerHandlingRating,
    overallPerformanceRating,
    specialistServices,
    experienceCertificateUrl,
    relievingLetterUrl,
    aadhaarNumber,
    aadhaarMasked: maskAadhaar(aadhaarNumber),
    address: stylist.address ?? "",
    photoUrl: stylist.photoUrl ?? "",
    status,
    joiningDate,
    leavingDate,
    employmentHistory: stylist.employmentHistory.map((entry) => {
      const formatted = formatHistoryEntry(entry, employeeId);
      if (!salonId || formatted.salonId !== salonId) {
        return formatted;
      }
      return {
        ...formatted,
        performanceSummary: formatted.performanceSummary ?? performanceSummary,
        managerFeedback: formatted.managerFeedback ?? managerFeedback,
        overallExperienceRating:
          formatted.overallExperienceRating ?? overallExperienceRating,
        technicalSkillRating:
          formatted.technicalSkillRating ?? technicalSkillRating,
        customerHandlingRating:
          formatted.customerHandlingRating ?? customerHandlingRating,
        overallPerformanceRating:
          formatted.overallPerformanceRating ??
          calculateOverallPerformanceRating({
            overallExperienceRating:
              formatted.overallExperienceRating ?? overallExperienceRating,
            technicalSkillRating:
              formatted.technicalSkillRating ?? technicalSkillRating,
            customerHandlingRating:
              formatted.customerHandlingRating ?? customerHandlingRating,
          }) ??
          overallPerformanceRating,
        specialistServices: formatted.specialistServices ?? specialistServices,
        experienceCertificateUrl:
          formatted.experienceCertificateUrl ?? experienceCertificateUrl,
        relievingLetterUrl:
          formatted.relievingLetterUrl ?? relievingLetterUrl,
      };
    }),
    createdAt: stylist.createdAt.toISOString(),
    updatedAt: stylist.updatedAt.toISOString(),
  };
}

export function hasEmploymentDocuments(input: {
  experienceCertificateUrl?: string;
  relievingLetterUrl?: string;
}): boolean {
  return Boolean(
    (input.experienceCertificateUrl && input.experienceCertificateUrl.trim()) ||
      (input.relievingLetterUrl && input.relievingLetterUrl.trim())
  );
}
