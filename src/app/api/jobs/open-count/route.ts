import { connectDB } from "@/lib/db";
import { requireStylistSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import { activeSalonIdsForStylist } from "@/lib/hiring";
import Application from "@/models/Application";
import Job from "@/models/Job";
import Stylist from "@/models/Stylist";

/** Unapplied open job count for stylist Jobs badge. */
export async function GET() {
  try {
    const session = await requireStylistSession();
    if (!session?.stylistId) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const stylist = await Stylist.findById(session.stylistId).select(
      "employmentHistory"
    );
    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    const excludeSalonIds = activeSalonIdsForStylist(stylist);
    const applied = await Application.find({ stylistId: session.stylistId })
      .select("jobId")
      .lean();
    const appliedJobIds = applied.map((entry) => entry.jobId);

    const count = await Job.countDocuments({
      status: "open",
      ...(appliedJobIds.length > 0 ? { _id: { $nin: appliedJobIds } } : {}),
      ...(excludeSalonIds.length > 0
        ? { salonId: { $nin: excludeSalonIds } }
        : {}),
    });

    return jsonSuccess({ count });
  } catch (error) {
    console.error("Open jobs count error:", error);
    return jsonError("Failed to load open jobs count", 500);
  }
}
