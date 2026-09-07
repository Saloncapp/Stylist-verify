import Stylist from "@/models/Stylist";

/**
 * Indexes used by public/private verify (`buildVerifyQuery`):
 * - aadhaarHash — hash-only Aadhaar lookup
 * - mobileNumber — phone lookup
 *
 * Call from `npm run db:migrate` only — not from connectDB / request path.
 */
export async function ensureVerifyIndexes(): Promise<void> {
  await Stylist.collection.createIndex(
    { aadhaarHash: 1 },
    { unique: true, sparse: true, name: "aadhaarHash_1" }
  );
  await Stylist.collection.createIndex(
    { mobileNumber: 1 },
    { unique: true, name: "mobileNumber_1" }
  );
}
