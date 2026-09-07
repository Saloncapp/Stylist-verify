/**
 * Ensure verify search indexes (aadhaarHash + mobileNumber).
 *
 *   npm run db:migrate:verify-indexes
 *   npx tsx --env-file=.env scripts/ensure-verify-indexes.ts
 */
async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  const { connectDB } = await import("../src/lib/db");
  const { ensureVerifyIndexes } = await import("../src/lib/verify-indexes");

  await connectDB();
  console.log("Creating verify search indexes (aadhaarHash, mobileNumber)…");
  await ensureVerifyIndexes();
  console.log("Verify indexes ready.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Failed to ensure verify indexes:", error);
  process.exit(1);
});
