export type StylistLevel = "L1" | "L2" | "L3" | "L4";
export type StylistStatus = "Active" | "Relieved" | "Abscond";

export interface EmploymentHistoryEntry {
  status: StylistStatus;
  remark?: string;
  salonId: string;
  salonName: string;
  level: StylistLevel;
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

export interface StylistRecord {
  id: string;
  salonId: string;
  salonName: string;
  name: string;
  mobileNumber: string;
  level: StylistLevel;
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

export interface VerificationResult {
  found: boolean;
  locked?: boolean;
  count?: number;
  stylists: VerifiedStylistResult[];
  multiple?: boolean;
}

export interface DashboardStats {
  total: number;
  active: number;
  relieved: number;
  absconded: number;
}
