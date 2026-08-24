import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { StylistRole } from "@/lib/employment-constants";

export type InterestRequestStatus =
  | "pending"
  | "accepted"
  | "cancelled"
  | "withdrawn";

export interface IInterestJobSnapshot {
  role: string;
  employmentType?: string;
  salonName: string;
  salonAddress?: string;
  salonLogoUrl?: string;
}

export interface IInterestStylistSnapshot {
  name: string;
  mobileNumber: string;
  photoUrl?: string;
  latestRole?: StylistRole;
}

export interface IInterestRequest extends Document {
  jobId: mongoose.Types.ObjectId;
  stylistId: mongoose.Types.ObjectId;
  salonId: mongoose.Types.ObjectId;
  status: InterestRequestStatus;
  message: string;
  jobSnapshot: IInterestJobSnapshot;
  stylistSnapshot: IInterestStylistSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

const InterestJobSnapshotSchema = new Schema<IInterestJobSnapshot>(
  {
    role: { type: String, required: true },
    employmentType: { type: String, default: "" },
    salonName: { type: String, required: true },
    salonAddress: { type: String, default: "" },
    salonLogoUrl: { type: String, default: "" },
  },
  { _id: false }
);

const InterestStylistSnapshotSchema = new Schema<IInterestStylistSnapshot>(
  {
    name: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    photoUrl: { type: String, default: "" },
    latestRole: { type: String },
  },
  { _id: false }
);

const InterestRequestSchema = new Schema<IInterestRequest>(
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
      enum: ["pending", "accepted", "cancelled", "withdrawn"],
      default: "pending",
      required: true,
    },
    message: { type: String, required: true },
    jobSnapshot: { type: InterestJobSnapshotSchema, required: true },
    stylistSnapshot: {
      type: InterestStylistSnapshotSchema,
      required: true,
    },
  },
  { timestamps: true }
);

/** One pending interest per job + stylist pair. */
InterestRequestSchema.index(
  { jobId: 1, stylistId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  }
);
InterestRequestSchema.index({ stylistId: 1, status: 1, createdAt: -1 });
InterestRequestSchema.index({ salonId: 1, status: 1, createdAt: -1 });

if (mongoose.models.InterestRequest) {
  delete mongoose.models.InterestRequest;
}

const InterestRequest: Model<IInterestRequest> =
  mongoose.model<IInterestRequest>("InterestRequest", InterestRequestSchema);

export default InterestRequest;
