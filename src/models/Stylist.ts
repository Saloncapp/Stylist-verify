import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { StylistLevel, StylistStatus } from "@/types";

export interface IEmploymentHistoryEntry {
  status: StylistStatus;
  remark?: string;
  salonId: mongoose.Types.ObjectId;
  salonName: string;
  level: StylistLevel;
  joiningDate?: Date;
  leavingDate?: Date;
  updatedAt: Date;
}

export interface IStylist extends Document {
  salonId: mongoose.Types.ObjectId;
  salonName: string;
  name: string;
  mobileNumber: string;
  level: StylistLevel;
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
    level: { type: String, enum: ["L1", "L2", "L3", "L4"], required: true },
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
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, index: true },
    level: { type: String, enum: ["L1", "L2", "L3", "L4"], required: true },
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

// Hot reload can keep a stale compiled model with the old required flags
if (mongoose.models.Stylist) {
  const cached = mongoose.models.Stylist as Model<IStylist>;
  cached.schema.path("address")?.required(false);
  cached.schema.path("photoUrl")?.required(false);
}

const Stylist: Model<IStylist> =
  (mongoose.models.Stylist as Model<IStylist> | undefined) ??
  mongoose.model<IStylist>("Stylist", StylistSchema);

export default Stylist;
