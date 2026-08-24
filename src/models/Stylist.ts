import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { SalonType } from "@/lib/salon-constants";
import type { EmploymentType, StylistRole } from "@/lib/employment-constants";
import type { StylistLevel, StylistStatus } from "@/types";

export interface ISalonSnapshot {
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

export interface IEmploymentHistoryEntry {
  _id?: mongoose.Types.ObjectId;
  salonId: mongoose.Types.ObjectId;
  salonSnapshot: ISalonSnapshot;
  jobId?: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  employeeId?: string;
  status?: StylistStatus;
  remark?: string;
  level?: StylistLevel;
  role?: StylistRole;
  employmentType?: EmploymentType;
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
  employeeId?: string;
  aadhaarHash: string;
  aadhaarEncrypted: string;
  /** @deprecated Legacy plain-text field — migrate to encrypted fields */
  aadhaarNumber?: string;
  name: string;
  mobileNumber: string;
  firebaseUid?: string;
  address?: string;
  photoUrl?: string;
  openToWork: boolean;
  openToWorkAt?: Date;
  employmentHistory: IEmploymentHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const SalonSnapshotSchema = new Schema<ISalonSnapshot>(
  {
    salonName: { type: String, required: true },
    salonLogoUrl: { type: String, default: "" },
    salonType: {
      type: String,
      enum: ["Unisex", "Men", "Women"],
      default: "Unisex",
    },
    salonAddress: { type: String, default: "" },
    salonEmail: { type: String, default: "" },
    salonNumber: { type: String, default: "" },
    googleMapsLocation: { type: String, default: "" },
    websiteUrl: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    facebookUrl: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    youtubeUrl: { type: String, default: "" },
    establishmentYear: { type: Number },
  },
  { _id: false }
);

const EmploymentHistorySchema = new Schema<IEmploymentHistoryEntry>(
  {
    salonId: { type: Schema.Types.ObjectId, ref: "Salon", required: true },
    salonSnapshot: { type: SalonSnapshotSchema, required: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job" },
    applicationId: { type: Schema.Types.ObjectId, ref: "Application" },
    employeeId: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Active", "Relieved", "Abscond"],
    },
    remark: { type: String },
    level: { type: String, enum: ["L1", "L2", "L3", "L4"] },
    role: {
      type: String,
      enum: ["Junior Stylist", "Stylist", "Senior Stylist"],
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Temporary"],
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
  { _id: true }
);

const StylistSchema = new Schema<IStylist>(
  {
    employeeId: { type: String, trim: true },
    aadhaarHash: { type: String },
    aadhaarEncrypted: { type: String },
    aadhaarNumber: { type: String },
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, unique: true },
    firebaseUid: { type: String, sparse: true, unique: true },
    address: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    openToWork: { type: Boolean, default: false },
    openToWorkAt: { type: Date },
    employmentHistory: { type: [EmploymentHistorySchema], default: [] },
  },
  { timestamps: true }
);

StylistSchema.index({ employeeId: 1 }, { unique: true, sparse: true });
StylistSchema.index({ aadhaarHash: 1 }, { unique: true, sparse: true });
StylistSchema.index({ "employmentHistory.salonId": 1 });
StylistSchema.index({
  "employmentHistory.salonId": 1,
  "employmentHistory.status": 1,
});
StylistSchema.index({ openToWork: 1, openToWorkAt: -1 });

if (mongoose.models.Stylist) {
  delete mongoose.models.Stylist;
}

const Stylist: Model<IStylist> = mongoose.model<IStylist>(
  "Stylist",
  StylistSchema
);

export default Stylist;
