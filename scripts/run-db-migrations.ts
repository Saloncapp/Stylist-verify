/**
 * One-off DB migrations (stylist unify + hiring indexes).
 * Not run on request cold starts — invoke manually when needed:
 *
 *   npx tsx --env-file=.env.local scripts/run-db-migrations.ts
 *
 * Or set MONGODB_URI in the environment first.
 */
async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  const { runDatabaseMigrations } = await import("../src/lib/db");
  console.log("Running database migrations…");
  await runDatabaseMigrations();
  console.log("Migrations finished.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
