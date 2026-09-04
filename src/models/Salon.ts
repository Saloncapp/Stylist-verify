import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { SalonType } from "@/lib/salon-constants";

export interface ISalon extends Document {
  salonName: string;
  ownerName?: string;
  email?: string;
  staffCount?: number;
  salonNumber: string;
  salonAddress: string;
  firebaseUid?: string;
  recoveryPinHash?: string;
  recoveryPinFailedAttempts?: number;
  recoveryPinLockedUntil?: Date;
  /** Bumped on phone change / recovery so older JWTs are rejected. */
  authSessionVersion?: number;
  logoUrl?: string;
  salonType: SalonType;
  googleMapsLocation?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappNumber?: string;
  youtubeUrl?: string;
  establishmentYear?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SalonSchema = new Schema<ISalon>(
  {
    salonName: { type: String, required: true, trim: true },
    ownerName: { type: String, trim: true, default: "" },
    email: { type: String, lowercase: true, trim: true },
    staffCount: { type: Number, min: 1 },
    salonNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    salonAddress: { type: String, required: true, trim: true },
    firebaseUid: { type: String, sparse: true, unique: true },
    recoveryPinHash: { type: String, select: false },
    recoveryPinFailedAttempts: { type: Number, default: 0 },
    recoveryPinLockedUntil: { type: Date },
    authSessionVersion: { type: Number, default: 0 },
    logoUrl: { type: String, default: "" },
    salonType: {
      type: String,
      enum: ["Unisex", "Men", "Women"],
      default: "Unisex",
    },
    googleMapsLocation: { type: String, default: "" },
    websiteUrl: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    facebookUrl: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    youtubeUrl: { type: String, default: "" },
    establishmentYear: { type: Number },
  },
  { timestamps: true }
);

if (mongoose.models.Salon) {
  delete mongoose.models.Salon;
}

const Salon: Model<ISalon> = mongoose.model<ISalon>("Salon", SalonSchema);

export default Salon;
