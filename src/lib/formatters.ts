import { getAadhaarFromRecord, maskAadhaar } from "@/lib/aadhaar-crypto";
import { DEFAULT_SALON_TYPE } from "@/lib/salon-constants";
import {
  DEFAULT_EMPLOYMENT_TYPE,
  DEFAULT_STYLIST_ROLE,
} from "@/lib/employment-constants";
import {
  calculateOverallPerformanceRating,
  hasPerformanceRatings,
} from "@/lib/performance-ratings";
import type { IStylist } from "@/models/Stylist";
import type { StylistRecord, EmploymentHistoryEntry } from "@/types";

export function formatStylist(stylist: IStylist): StylistRecord {
  const aadhaarNumber = getAadhaarFromRecord(stylist);
  const performanceSummary = stylist.performanceSummary || undefined;
  const managerFeedback = stylist.managerFeedback || undefined;
  const overallExperienceRating = stylist.overallExperienceRating || undefined;
  const technicalSkillRating = stylist.technicalSkillRating || undefined;
  const customerHandlingRating = stylist.customerHandlingRating || undefined;
  const overallPerformanceRating =
    stylist.overallPerformanceRating ||
    calculateOverallPerformanceRating({
      overallExperienceRating,
      technicalSkillRating,
      customerHandlingRating,
    });
  const specialistServices = stylist.specialistServices?.length
    ? stylist.specialistServices
    : undefined;
  const experienceCertificateUrl =
    stylist.experienceCertificateUrl || undefined;
  const relievingLetterUrl = stylist.relievingLetterUrl || undefined;

  return {
    id: stylist._id.toString(),
    salonId: stylist.salonId.toString(),
    salonName: stylist.salonName,
    salonLogoUrl: stylist.salonLogoUrl || undefined,
    salonType: stylist.salonType ?? DEFAULT_SALON_TYPE,
    salonAddress: stylist.salonAddress || undefined,
    googleMapsLocation: stylist.googleMapsLocation || undefined,
    websiteUrl: stylist.websiteUrl || undefined,
    salonEmail: stylist.salonEmail || undefined,
    salonNumber: stylist.salonNumber || undefined,
    instagramUrl: stylist.instagramUrl || undefined,
    facebookUrl: stylist.facebookUrl || undefined,
    whatsappNumber: stylist.whatsappNumber || undefined,
    youtubeUrl: stylist.youtubeUrl || undefined,
    establishmentYear: stylist.establishmentYear || undefined,
    name: stylist.name,
    mobileNumber: stylist.mobileNumber,
    level: stylist.level,
    role: stylist.role ?? DEFAULT_STYLIST_ROLE,
    employmentType: stylist.employmentType ?? DEFAULT_EMPLOYMENT_TYPE,
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
    status: stylist.status,
    joiningDate: stylist.joiningDate.toISOString(),
    leavingDate: stylist.leavingDate?.toISOString(),
    employmentHistory: stylist.employmentHistory.map((entry) => {
      const formatted = formatHistoryEntry(entry);
      // Prefer entry values; fall back to salon stylist record so UI stays in sync
      return {
        ...formatted,
        performanceSummary:
          formatted.performanceSummary ?? performanceSummary,
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
        specialistServices:
          formatted.specialistServices ?? specialistServices,
        experienceCertificateUrl:
          formatted.experienceCertificateUrl ?? experienceCertificateUrl,
        relievingLetterUrl:
          formatted.relievingLetterUrl ?? relievingLetterUrl,
        salonAddress:
          formatted.salonAddress || stylist.salonAddress || undefined,
        googleMapsLocation:
          formatted.googleMapsLocation ||
          stylist.googleMapsLocation ||
          undefined,
        websiteUrl: formatted.websiteUrl || stylist.websiteUrl || undefined,
        salonEmail: formatted.salonEmail || stylist.salonEmail || undefined,
        salonNumber: formatted.salonNumber || stylist.salonNumber || undefined,
        instagramUrl:
          formatted.instagramUrl || stylist.instagramUrl || undefined,
        facebookUrl: formatted.facebookUrl || stylist.facebookUrl || undefined,
        whatsappNumber:
          formatted.whatsappNumber || stylist.whatsappNumber || undefined,
        youtubeUrl: formatted.youtubeUrl || stylist.youtubeUrl || undefined,
        establishmentYear:
          formatted.establishmentYear ||
          stylist.establishmentYear ||
          undefined,
      };
    }),
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
    salonLogoUrl: entry.salonLogoUrl || undefined,
    salonType: entry.salonType ?? DEFAULT_SALON_TYPE,
    salonAddress: entry.salonAddress || undefined,
    googleMapsLocation: entry.googleMapsLocation || undefined,
    websiteUrl: entry.websiteUrl || undefined,
    salonEmail: entry.salonEmail || undefined,
    salonNumber: entry.salonNumber || undefined,
    instagramUrl: entry.instagramUrl || undefined,
    facebookUrl: entry.facebookUrl || undefined,
    whatsappNumber: entry.whatsappNumber || undefined,
    youtubeUrl: entry.youtubeUrl || undefined,
    establishmentYear: entry.establishmentYear || undefined,
    level: entry.level,
    role: entry.role ?? DEFAULT_STYLIST_ROLE,
    employmentType: entry.employmentType ?? DEFAULT_EMPLOYMENT_TYPE,
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

export function hasPerformanceInfo(input: {
  performanceSummary?: string;
  managerFeedback?: string;
  specialistServices?: string[];
  overallExperienceRating?: number;
  technicalSkillRating?: number;
  customerHandlingRating?: number;
  overallPerformanceRating?: number;
}): boolean {
  return Boolean(
    (input.performanceSummary && input.performanceSummary.trim()) ||
      (input.managerFeedback && input.managerFeedback.trim()) ||
      (input.specialistServices && input.specialistServices.length > 0) ||
      hasPerformanceRatings(input)
  );
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
