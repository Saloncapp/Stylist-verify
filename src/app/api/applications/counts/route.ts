import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import { getApplicationStatusCounts } from "@/lib/hiring";

/** Per-status application counts for salon applicant tabs. */
export async function GET() {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const counts = await getApplicationStatusCounts(session.salonId);

    return jsonSuccess({ counts });
  } catch (error) {
    console.error("Application counts error:", error);
    return jsonError("Failed to load applicant counts", 500);
  }
}
