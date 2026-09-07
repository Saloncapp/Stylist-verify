import { connectDB } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/api";

/**
 * Lightweight warm-up for serverless + Mongo.
 * Used by /verify to connect early while the user types.
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
