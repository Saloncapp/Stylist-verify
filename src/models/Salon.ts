import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { SalonType } from "@/lib/salon-constants";

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
  logoUrl?: string;
  salonType: SalonType;
  salonAddress?: string;
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
    logoUrl: { type: String, default: "" },
    salonType: {
      type: String,
      enum: ["Unisex", "Men", "Women"],
      default: "Unisex",
    },
    salonAddress: { type: String, default: "" },
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
