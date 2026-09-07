import { connectDB } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/api";

/**
 * Lightweight warm-up endpoint: opens/caches the Mongo connection.
 * Used by /verify prefetch — keep this free of migrations and heavy work.
 */
export async function GET() {
  try {
    await connectDB();
    return jsonSuccess({ ok: true });
  } catch (error) {
    console.error("Health check error:", error);
    return jsonError("Service unavailable", 503);
  }
}
