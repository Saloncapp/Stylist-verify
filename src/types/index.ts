import type { SalonType } from "@/lib/salon-constants";
import type { EmploymentType, StylistRole } from "@/lib/employment-constants";
import type { PerformanceRatingFields } from "@/lib/performance-ratings";

export type { SalonType };
export type { StylistRole, EmploymentType };

export type StylistLevel = "L1" | "L2" | "L3" | "L4";
export type StylistStatus = "Active" | "Relieved" | "Abscond";

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

export interface EmploymentHistoryEntry extends SalonIdentityFields, PerformanceRatingFields {
  status: StylistStatus;
  remark?: string;
  salonId: string;
  level: StylistLevel;
  role: StylistRole;
  employmentType: EmploymentType;
  performanceSummary?: string;
  managerFeedback?: string;
  specialistServices?: string[];
  experienceCertificateUrl?: string;
  relievingLetterUrl?: string;
  joiningDate?: string;
  leavingDate?: string;
  updatedAt: string;
}

export type AuthProvider = "email" | "google";

export interface SalonUser {
  id: string;
  salonName: string;
  ownerName: string;
  email: string;
  staffCount: number;
  location: string;
  salonNumber?: string;
  logoUrl?: string;
  salonType: SalonType;
  salonAddress?: string;
  googleMapsLocation?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappNumber?: string;
  youtubeUrl?: string;
  establishmentYear?: number;
  authProvider: AuthProvider;
  /** True when account is linked to Google (native Google signup or verified via Google) */
  googleLinked: boolean;
  salonNumberVerified: boolean;
}

export interface VerificationEmploymentPrivateEntry
  extends EmploymentHistoryEntry {
  stylistName: string;
  mobileNumber: string;
}

export interface VerifiedStylistPrivateResult {
  name: string;
  mobileNumber: string;
  aadhaarMasked: string;
  address?: string;
  level: StylistLevel;
  status: StylistStatus;
  photoUrl?: string;
  employmentHistory: VerificationEmploymentPrivateEntry[];
}

export interface PrivateVerificationResult {
  found: boolean;
  stylists: VerifiedStylistPrivateResult[];
  multiple?: boolean;
}

export interface StylistRecord extends PerformanceRatingFields {
  id: string;
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
  level: StylistLevel;
  role: StylistRole;
  employmentType: EmploymentType;
  performanceSummary?: string;
  managerFeedback?: string;
  specialistServices?: string[];
  experienceCertificateUrl?: string;
  relievingLetterUrl?: string;
  aadhaarNumber: string;
  aadhaarMasked: string;
  address?: string;
  photoUrl?: string;
  status: StylistStatus;
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
  maskedMobile: string;
  maskedAadhaar: string;
  level: StylistLevel;
  status: StylistStatus;
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
