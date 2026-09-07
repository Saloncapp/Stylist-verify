/**
 * One-off / deploy-time DB migrations.
 * Do NOT import this from API routes or connectDB — cold requests must stay fast.
 *
 * Run manually:
 *   npm run db:migrate
 *   npx tsx --env-file=.env.local scripts/run-db-migrations.ts
 */
import { connectDB } from "@/lib/db";

export async function runDatabaseMigrations(): Promise<void> {
  const { unifyStylistProfiles } = await import("@/lib/stylist-merge");
  const { ensureHiringIndexes } = await import("@/lib/hiring");
  await connectDB();
  await unifyStylistProfiles();
  await ensureHiringIndexes();
}
