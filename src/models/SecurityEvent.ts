import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISecurityEvent extends Document {
  role: "salon" | "stylist";
  accountId: mongoose.Types.ObjectId;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SecurityEventSchema = new Schema<ISecurityEvent>(
  {
    role: { type: String, enum: ["salon", "stylist"], required: true },
    accountId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SecurityEventSchema.index({ role: 1, accountId: 1, read: 1, createdAt: -1 });

if (mongoose.models.SecurityEvent) {
  delete mongoose.models.SecurityEvent;
}

const SecurityEvent: Model<ISecurityEvent> = mongoose.model<ISecurityEvent>(
  "SecurityEvent",
  SecurityEventSchema
);

export default SecurityEvent;
