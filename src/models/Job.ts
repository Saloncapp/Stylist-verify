import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { EmploymentType, StylistRole } from "@/lib/employment-constants";
import type { StylistLevel } from "@/types";

export type JobStatus = "open" | "closed";

export interface IJobSalonSnapshot {
  salonName: string;
  salonAddress?: string;
  salonLogoUrl?: string;
}

export interface IJob extends Document {
  salonId: mongoose.Types.ObjectId;
  salonSnapshot: IJobSalonSnapshot;
  role: StylistRole;
  employmentType: EmploymentType;
  level?: StylistLevel;
  description: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}

const JobSalonSnapshotSchema = new Schema<IJobSalonSnapshot>(
  {
    salonName: { type: String, required: true },
    salonAddress: { type: String, default: "" },
    salonLogoUrl: { type: String, default: "" },
  },
  { _id: false }
);

const JobSchema = new Schema<IJob>(
  {
    salonId: {
      type: Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
      index: true,
    },
    salonSnapshot: { type: JobSalonSnapshotSchema, required: true },
    role: {
      type: String,
      enum: ["Junior Stylist", "Stylist", "Senior Stylist"],
      required: true,
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Temporary"],
      required: true,
    },
    level: { type: String, enum: ["L1", "L2", "L3", "L4"] },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      required: true,
    },
  },
  { timestamps: true }
);

JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ salonId: 1, createdAt: -1 });

if (mongoose.models.Job) {
  delete mongoose.models.Job;
}

const Job: Model<IJob> = mongoose.model<IJob>("Job", JobSchema);

export default Job;
