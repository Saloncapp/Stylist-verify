import { connectDB } from "@/lib/db";
import { requireStylistSession, toStylistAccount } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import { getAadhaarFromRecord, maskAadhaar } from "@/lib/aadhaar-crypto";
import {
  getStylistApplicationStatusCounts,
  getStylistApplicationsPreview,
  getStylistJobsPreview,
} from "@/lib/hiring";
import InterestRequest from "@/models/InterestRequest";
import Stylist from "@/models/Stylist";

/**
 * Stylist home dashboard aggregate — same data as SSR `/stylist` page,
 * plus pending invite count for mobile.
 */
export async function GET() {
  try {
    const session = await requireStylistSession();
    if (!session?.stylistId) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const stylist = await Stylist.findById(session.stylistId);
    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    const [jobs, applications, statusCounts, invites] = await Promise.all([
      getStylistJobsPreview(session.stylistId, stylist),
      getStylistApplicationsPreview(session.stylistId),
      getStylistApplicationStatusCounts(session.stylistId),
      InterestRequest.countDocuments({
        stylistId: session.stylistId,
        status: "pending",
      }),
    ]);

    let aadhaarMasked: string | undefined;
    try {
      aadhaarMasked = maskAadhaar(getAadhaarFromRecord(stylist));
    } catch {
      aadhaarMasked = undefined;
    }

    const latestRole = stylist.employmentHistory?.length
      ? [...stylist.employmentHistory].sort(
          (a, b) =>
            new Date(b.joiningDate ?? b.updatedAt).getTime() -
            new Date(a.joiningDate ?? a.updatedAt).getTime()
        )[0]?.role
      : undefined;

    return jsonSuccess({
      stylist: toStylistAccount({
        ...stylist.toObject(),
        aadhaarMasked,
      }),
      latestRole,
      stats: {
        openJobs: jobs.count,
        applications:
          statusCounts.Interested + statusCounts.Hired + statusCounts.Rejected,
        interested: statusCounts.Interested,
        invites,
        employment: stylist.employmentHistory?.length ?? 0,
      },
      jobs,
      applications,
    });
  } catch (error) {
    console.error("Stylist dashboard error:", error);
    return jsonError("Failed to load dashboard", 500);
  }
}
