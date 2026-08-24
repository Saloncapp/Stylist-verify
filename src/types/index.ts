import type { SalonType } from "@/lib/salon-constants";
import type { EmploymentType, StylistRole } from "@/lib/employment-constants";
import type { PerformanceRatingFields } from "@/lib/performance-ratings";

export type { SalonType };
export type { StylistRole, EmploymentType };

export type StylistLevel = "L1" | "L2" | "L3" | "L4";
export type StylistStatus = "Active" | "Relieved" | "Abscond";
export type UserRole = "salon" | "stylist";

export interface SalonIdentityFields {
  salonName: string;
  salonLogoUrl?: string;
  salonType: SalonType;
  salonAddress?: string;
  salonEmail?: string;
  salonNumber?: string;
  googleMapsLocation?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappNumber?: string;
  youtubeUrl?: string;
  establishmentYear?: number;
}

export interface SalonVisitProfile extends SalonIdentityFields {}

export interface EmploymentHistoryEntry
  extends SalonIdentityFields,
    PerformanceRatingFields {
  id?: string;
  employeeId?: string;
  status?: StylistStatus;
  remark?: string;
  salonId: string;
  level?: StylistLevel;
  role?: StylistRole;
  employmentType?: EmploymentType;
  performanceSummary?: string;
  managerFeedback?: string;
  specialistServices?: string[];
  experienceCertificateUrl?: string;
  relievingLetterUrl?: string;
  joiningDate?: string;
  leavingDate?: string;
  updatedAt: string;
}

export interface SalonUser {
  id: string;
  salonName: string;
  ownerName: string;
  email: string;
  staffCount: number;
  salonNumber: string;
  salonAddress: string;
  logoUrl?: string;
  salonType: SalonType;
  googleMapsLocation?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappNumber?: string;
  youtubeUrl?: string;
  establishmentYear?: number;
}

export interface StylistAccount {
  id: string;
  employeeId?: string;
  name: string;
  mobileNumber: string;
  address?: string;
  photoUrl?: string;
  aadhaarMasked?: string;
  openToWork?: boolean;
  openToWorkAt?: string;
}

export type JobStatus = "open" | "closed";
export type ApplicationStatus = "Interested" | "Rejected" | "Hired";

export interface HiringJobCard {
  id: string;
  salonId: string;
  salonName: string;
  salonAddress?: string;
  salonLogoUrl?: string;
  role: StylistRole;
  employmentType: EmploymentType;
  level?: StylistLevel;
  description: string;
  status: JobStatus;
  applied?: boolean;
  createdAt: string;
}

export interface OpenToWorkTalentCard {
  id: string;
  name: string;
  mobileNumber: string;
  /** Full number is only sent when the stylist is an applicant for this salon. */
  phoneRevealed?: boolean;
  address?: string;
  photoUrl?: string;
  latestRole?: StylistRole;
  latestLevel?: StylistLevel;
  openToWorkAt?: string;
}

export type InterestRequestStatus =
  | "pending"
  | "accepted"
  | "cancelled"
  | "withdrawn";

export interface InterestRequestCard {
  id: string;
  jobId: string;
  stylistId: string;
  salonId: string;
  status: InterestRequestStatus;
  message: string;
  salonName: string;
  salonAddress?: string;
  salonLogoUrl?: string;
  jobRole: string;
  jobEmploymentType?: string;
  stylistName: string;
  stylistPhotoUrl?: string;
  createdAt: string;
}

export interface HiringApplicationCard {
  id: string;
  jobId: string;
  stylistId: string;
  salonId: string;
  status: ApplicationStatus;
  stylistName: string;
  stylistMobile: string;
  stylistAddress?: string;
  stylistPhotoUrl?: string;
  latestRole?: StylistRole;
  jobRole: string;
  jobEmploymentType?: string;
  salonName: string;
  salonAddress?: string;
  createdAt: string;
}

export interface PaginatedHiringResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export interface VerificationEmploymentPrivateEntry
  extends EmploymentHistoryEntry {
  stylistName: string;
  mobileNumber: string;
}

export interface VerifiedStylistPrivateResult {
  name: string;
  employeeId?: string;
  mobileNumber: string;
  aadhaarMasked: string;
  address?: string;
  level?: StylistLevel;
  status?: StylistStatus;
  photoUrl?: string;
  employmentHistory: VerificationEmploymentPrivateEntry[];
}

export interface PrivateVerificationResult {
  found: boolean;
  stylists: VerifiedStylistPrivateResult[];
  multiple?: boolean;
}

/** Dashboard view: identity + current salon employment (derived from history) */
export interface StylistRecord extends PerformanceRatingFields {
  id: string;
  employeeId?: string;
  salonId: string;
  salonName: string;
  salonLogoUrl?: string;
  salonType: SalonType;
  salonAddress?: string;
  googleMapsLocation?: string;
  websiteUrl?: string;
  salonEmail?: string;
  salonNumber?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappNumber?: string;
  youtubeUrl?: string;
  establishmentYear?: number;
  name: string;
  mobileNumber: string;
  level?: StylistLevel;
  role?: StylistRole;
  employmentType?: EmploymentType;
  performanceSummary?: string;
  managerFeedback?: string;
  specialistServices?: string[];
  experienceCertificateUrl?: string;
  relievingLetterUrl?: string;
  aadhaarNumber: string;
  aadhaarMasked: string;
  address?: string;
  photoUrl?: string;
  status?: StylistStatus;
  joiningDate: string;
  leavingDate?: string;
  employmentHistory: EmploymentHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface VerificationEmploymentEntry extends EmploymentHistoryEntry {
  stylistName: string;
  maskedMobile: string;
}

export interface VerifiedStylistResult {
  name: string;
  employeeId?: string;
  maskedMobile: string;
  maskedAadhaar: string;
  level?: StylistLevel;
  status?: StylistStatus;
  photoUrl?: string;
  employmentHistory: VerificationEmploymentEntry[];
}

export interface PublicStylistPreview {
  displayName: string;
  role: string;
  experienceLabel: string;
  employmentCount: number;
  performanceRating?: number;
}

export interface VerificationResult {
  found: boolean;
  locked?: boolean;
  count?: number;
  stylists: VerifiedStylistResult[];
  previews?: PublicStylistPreview[];
  multiple?: boolean;
}

export interface DashboardStats {
  total: number;
  active: number;
  relieved: number;
  absconded: number;
}

/** Stylist home dashboard summary cards. */
export interface StylistDashboardStats {
  openJobs: number;
  applications: number;
  interested: number;
  employment: number;
}
