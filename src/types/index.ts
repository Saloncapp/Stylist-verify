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

export interface SalonUser {
  id: string;
  salonName: string;
  ownerName: string;
  email: string;
  staffCount: number;
  location: string;
}

export interface StylistRecord {
  id: string;
  salonId: string;
  salonName: string;
  name: string;
  mobileNumber: string;
  level: StylistLevel;
  aadhaarNumber: string;
  address: string;
  photoUrl: string;
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
  level: StylistLevel;
  status: StylistStatus;
  photoUrl: string;
  aadhaarNumber: string;
  employmentHistory: VerificationEmploymentEntry[];
}

export interface VerificationResult {
  found: boolean;
  stylists: VerifiedStylistResult[];
  multiple?: boolean;
}

export interface DashboardStats {
  total: number;
  active: number;
  relieved: number;
  absconded: number;
}
