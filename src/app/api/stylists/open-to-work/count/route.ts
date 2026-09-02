import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import { buildOpenToWorkTalentFilter } from "@/lib/hiring";
import Stylist from "@/models/Stylist";

/** Open-to-work talent count for salon Find Stylist badge. */
export async function GET() {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const count = await Stylist.countDocuments(
      buildOpenToWorkTalentFilter(session.salonId)
    );

    return jsonSuccess({ count });
  } catch (error) {
    console.error("Open-to-work count error:", error);
    return jsonError("Failed to load open-to-work count", 500);
  }
}
