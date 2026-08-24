import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStylistSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import {
  buildApplicationJobSnapshot,
  buildApplicationStylistSnapshot,
  formatApplicationCard,
} from "@/lib/hiring";
import { hasActiveEmploymentAtSalon } from "@/lib/stylist-employment";
import Application from "@/models/Application";
import Job from "@/models/Job";
import Stylist from "@/models/Stylist";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStylistSession();
    if (!session?.stylistId) {
      return jsonError("Not authenticated", 401);
    }

    const { id: jobId } = await context.params;

    await connectDB();

    const [job, stylist] = await Promise.all([
      Job.findById(jobId),
      Stylist.findById(session.stylistId),
    ]);

    if (!job || job.status !== "open") {
      return jsonError("This position is no longer open", 400);
    }
    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    if (hasActiveEmploymentAtSalon(stylist, job.salonId.toString())) {
      return jsonError(
        "You already work at this salon and cannot apply to its openings",
        400
      );
    }

    try {
      const application = await Application.create({
        jobId: job._id,
        stylistId: stylist._id,
        salonId: job.salonId,
        status: "Interested",
        stylistSnapshot: buildApplicationStylistSnapshot(stylist),
        jobSnapshot: buildApplicationJobSnapshot(job),
      });

      return jsonSuccess(
        { application: formatApplicationCard(application) },
        201
      );
    } catch (error) {
      const mongoError = error as { code?: number };
      if (mongoError.code === 11000) {
        return jsonError("You have already applied to this position", 409);
      }
      throw error;
    }
  } catch (error) {
    console.error("Apply to job error:", error);
    return jsonError("Failed to submit interest", 500);
  }
}
