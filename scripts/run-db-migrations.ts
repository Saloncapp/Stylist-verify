/**
 * One-off DB migrations (stylist unify + hiring indexes).
 * Not run on request cold starts — invoke manually when needed:
 *
 *   npm run db:migrate
 *   npx tsx --env-file=.env.local scripts/run-db-migrations.ts
 *
 * Requires MONGODB_URI in the environment / .env.local.
 */
async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  const { runDatabaseMigrations } = await import("../src/lib/db-migrations");
  console.log("Running database migrations…");
  await runDatabaseMigrations();
  console.log("Migrations finished.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
