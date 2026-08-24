import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { StylistRole } from "@/lib/employment-constants";

export type ApplicationStatus = "Interested" | "Rejected" | "Hired";

export interface IApplicationStylistSnapshot {
  name: string;
  mobileNumber: string;
  address?: string;
  photoUrl?: string;
  latestRole?: StylistRole;
}

export interface IApplicationJobSnapshot {
  role: string;
  employmentType?: string;
  salonName: string;
  salonAddress?: string;
}

export interface IApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  stylistId: mongoose.Types.ObjectId;
  salonId: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  stylistSnapshot: IApplicationStylistSnapshot;
  jobSnapshot: IApplicationJobSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationStylistSnapshotSchema = new Schema<IApplicationStylistSnapshot>(
  {
    name: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    address: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    latestRole: { type: String },
  },
  { _id: false }
);

const ApplicationJobSnapshotSchema = new Schema<IApplicationJobSnapshot>(
  {
    role: { type: String, required: true },
    employmentType: { type: String, default: "" },
    salonName: { type: String, required: true },
    salonAddress: { type: String, default: "" },
  },
  { _id: false }
);

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: "Stylist",
      required: true,
    },
    salonId: {
      type: Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Interested", "Rejected", "Hired"],
      default: "Interested",
      required: true,
    },
    stylistSnapshot: {
      type: ApplicationStylistSnapshotSchema,
      required: true,
    },
    jobSnapshot: { type: ApplicationJobSnapshotSchema, required: true },
  },
  { timestamps: true }
);

ApplicationSchema.index({ jobId: 1, stylistId: 1 }, { unique: true });
ApplicationSchema.index({ salonId: 1, createdAt: -1 });
ApplicationSchema.index({ stylistId: 1, createdAt: -1 });
ApplicationSchema.index({ jobId: 1, status: 1 });

if (mongoose.models.Application) {
  delete mongoose.models.Application;
}

const Application: Model<IApplication> = mongoose.model<IApplication>(
  "Application",
  ApplicationSchema
);

export default Application;
