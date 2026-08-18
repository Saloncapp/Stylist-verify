import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { SalonType } from "@/lib/salon-constants";
import type { EmploymentType, StylistRole } from "@/lib/employment-constants";
import type { StylistLevel, StylistStatus } from "@/types";

export interface IEmploymentHistoryEntry {
  status: StylistStatus;
  remark?: string;
  salonId: mongoose.Types.ObjectId;
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
  level: StylistLevel;
  role: StylistRole;
  employmentType: EmploymentType;
  performanceSummary?: string;
  managerFeedback?: string;
  overallExperienceRating?: number;
  technicalSkillRating?: number;
  customerHandlingRating?: number;
  overallPerformanceRating?: number;
  specialistServices?: string[];
  experienceCertificateUrl?: string;
  relievingLetterUrl?: string;
  joiningDate?: Date;
  leavingDate?: Date;
  updatedAt: Date;
}

export interface IStylist extends Document {
  salonId: mongoose.Types.ObjectId;
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
  overallExperienceRating?: number;
  technicalSkillRating?: number;
  customerHandlingRating?: number;
  overallPerformanceRating?: number;
  specialistServices?: string[];
  experienceCertificateUrl?: string;
  relievingLetterUrl?: string;
  aadhaarHash: string;
  aadhaarEncrypted: string;
  /** @deprecated Legacy plain-text field — migrate to encrypted fields */
  aadhaarNumber?: string;
  address?: string;
  photoUrl?: string;
  status: StylistStatus;
  joiningDate: Date;
  leavingDate?: Date;
  employmentHistory: IEmploymentHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const EmploymentHistorySchema = new Schema<IEmploymentHistoryEntry>(
  {
    status: {
      type: String,
      enum: ["Active", "Relieved", "Abscond"],
      required: true,
    },
    remark: { type: String },
    salonId: { type: Schema.Types.ObjectId, ref: "Salon", required: true },
    salonName: { type: String, required: true },
    salonLogoUrl: { type: String, default: "" },
    salonType: {
      type: String,
      enum: ["Unisex", "Men", "Women"],
      default: "Unisex",
    },
    salonAddress: { type: String, default: "" },
    googleMapsLocation: { type: String, default: "" },
    websiteUrl: { type: String, default: "" },
    salonEmail: { type: String, default: "" },
    salonNumber: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    facebookUrl: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    youtubeUrl: { type: String, default: "" },
    establishmentYear: { type: Number },
    level: { type: String, enum: ["L1", "L2", "L3", "L4"], required: true },
    role: {
      type: String,
      enum: ["Junior Stylist", "Stylist", "Senior Stylist"],
      default: "Stylist",
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Temporary"],
      default: "Full-time",
    },
    performanceSummary: { type: String, default: "" },
    managerFeedback: { type: String, default: "" },
    overallExperienceRating: { type: Number, min: 1, max: 5 },
    technicalSkillRating: { type: Number, min: 1, max: 5 },
    customerHandlingRating: { type: Number, min: 1, max: 5 },
    overallPerformanceRating: { type: Number, min: 1, max: 5 },
    specialistServices: { type: [String], default: [] },
    experienceCertificateUrl: { type: String, default: "" },
    relievingLetterUrl: { type: String, default: "" },
    joiningDate: { type: Date },
    leavingDate: { type: Date },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const StylistSchema = new Schema<IStylist>(
  {
    salonId: { type: Schema.Types.ObjectId, ref: "Salon", required: true, index: true },
    salonName: { type: String, required: true },
    salonLogoUrl: { type: String, default: "" },
    salonType: {
      type: String,
      enum: ["Unisex", "Men", "Women"],
      default: "Unisex",
    },
    salonAddress: { type: String, default: "" },
    googleMapsLocation: { type: String, default: "" },
    websiteUrl: { type: String, default: "" },
    salonEmail: { type: String, default: "" },
    salonNumber: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    facebookUrl: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    youtubeUrl: { type: String, default: "" },
    establishmentYear: { type: Number },
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, index: true },
    level: { type: String, enum: ["L1", "L2", "L3", "L4"], required: true },
    role: {
      type: String,
      enum: ["Junior Stylist", "Stylist", "Senior Stylist"],
      default: "Stylist",
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Temporary"],
      default: "Full-time",
    },
    performanceSummary: { type: String, default: "" },
    managerFeedback: { type: String, default: "" },
    overallExperienceRating: { type: Number, min: 1, max: 5 },
    technicalSkillRating: { type: Number, min: 1, max: 5 },
    customerHandlingRating: { type: Number, min: 1, max: 5 },
    overallPerformanceRating: { type: Number, min: 1, max: 5 },
    specialistServices: { type: [String], default: [] },
    experienceCertificateUrl: { type: String, default: "" },
    relievingLetterUrl: { type: String, default: "" },
    aadhaarHash: { type: String, index: true },
    aadhaarEncrypted: { type: String },
    aadhaarNumber: { type: String }, // legacy plain-text, do not use for new records
    address: { type: String, required: false, default: "" },
    photoUrl: { type: String, required: false, default: "" },
    status: {
      type: String,
      enum: ["Active", "Relieved", "Abscond"],
      required: true,
      default: "Active",
    },
    joiningDate: { type: Date, default: Date.now },
    leavingDate: { type: Date },
    employmentHistory: { type: [EmploymentHistorySchema], default: [] },
  },
  { timestamps: true }
);

// Same person (Aadhaar) can work at multiple salons, but only once per salon
StylistSchema.index({ aadhaarHash: 1, salonId: 1 }, { unique: true });

// Hot reload can keep a stale compiled schema (missing new fields like performance).
// Always rebuild so path definitions match this file.
if (mongoose.models.Stylist) {
  delete mongoose.models.Stylist;
}

const Stylist: Model<IStylist> = mongoose.model<IStylist>(
  "Stylist",
  StylistSchema
);

export default Stylist;
