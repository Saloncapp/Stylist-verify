import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISalon extends Document {
  salonName: string;
  ownerName: string;
  email: string;
  password: string;
  staffCount: number;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

const SalonSchema = new Schema<ISalon>(
  {
    salonName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    staffCount: { type: Number, required: true, min: 1 },
    location: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Salon: Model<ISalon> =
  mongoose.models.Salon ?? mongoose.model<ISalon>("Salon", SalonSchema);

export default Salon;
