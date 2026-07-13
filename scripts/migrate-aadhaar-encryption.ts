/**
 * One-time migration: encrypt existing plain-text Aadhaar numbers.
 * Run: npx tsx scripts/migrate-aadhaar-encryption.ts
 */
import mongoose from "mongoose";
import { prepareAadhaarStorage } from "../src/lib/aadhaar-crypto";

const MONGODB_URI = process.env.MONGODB_URI;

async function migrate() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection failed");

  const collection = db.collection("stylists");
  const legacy = await collection
    .find({
      aadhaarNumber: { $exists: true, $ne: null },
      $or: [
        { aadhaarEncrypted: { $exists: false } },
        { aadhaarEncrypted: null },
        { aadhaarEncrypted: "" },
      ],
    })
    .toArray();

  console.log(`Found ${legacy.length} stylist(s) to migrate`);

  for (const doc of legacy) {
    const plain = doc.aadhaarNumber as string;
    const { aadhaarHash, aadhaarEncrypted } = prepareAadhaarStorage(plain);

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: { aadhaarHash, aadhaarEncrypted },
        $unset: { aadhaarNumber: "" },
      }
    );

    console.log(`Migrated stylist ${doc._id}`);
  }

  console.log("Migration complete");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
