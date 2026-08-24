import mongoose, { Schema, type Model } from "mongoose";

interface IStylistCounter {
  _id: string;
  seq: number;
}

const StylistCounterSchema = new Schema<IStylistCounter>({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

if (mongoose.models.StylistCounter) {
  delete mongoose.models.StylistCounter;
}

const StylistCounter: Model<IStylistCounter> = mongoose.model<IStylistCounter>(
  "StylistCounter",
  StylistCounterSchema
);

export default StylistCounter;
