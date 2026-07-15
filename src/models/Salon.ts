import mongoose, { Schema, type Document, type Model } from "mongoose";

export type AuthProvider = "email" | "google";

export interface ISalon extends Document {
  salonName: string;
  ownerName: string;
  email: string;
  password?: string;
  authProvider: AuthProvider;
  googleUid?: string;
  staffCount: number;
  location: string;
  /** Salon contact phone — optional for legacy records, required on new registration */
  salonNumber?: string;
  salonNumberVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SalonSchema = new Schema<ISalon>(
  {
    salonName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    authProvider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },
    googleUid: { type: String, sparse: true, unique: true },
    staffCount: { type: Number, required: true, min: 1 },
    location: { type: String, required: true, trim: true },
    salonNumber: { type: String, trim: true },
    salonNumberVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Salon: Model<ISalon> =
  mongoose.models.Salon ?? mongoose.model<ISalon>("Salon", SalonSchema);

export default Salon;
