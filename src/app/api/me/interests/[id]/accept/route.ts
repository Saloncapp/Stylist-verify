import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStylistSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import {
  buildApplicationJobSnapshot,
  buildApplicationStylistSnapshot,
  formatApplicationCard,
  formatInterestRequestCard,
} from "@/lib/hiring";
import { hasActiveEmploymentAtSalon } from "@/lib/stylist-employment";
import Application from "@/models/Application";
import InterestRequest from "@/models/InterestRequest";
import Job from "@/models/Job";
import Stylist from "@/models/Stylist";

/** Stylist accepts a salon interest request → creates Application (Interested). */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStylistSession();
    if (!session?.stylistId) {
      return jsonError("Not authenticated", 401);
    }

    const { id } = await context.params;
    await connectDB();

    const interest = await InterestRequest.findOne({
      _id: id,
      stylistId: session.stylistId,
    });
    if (!interest) {
      return jsonError("Interest request not found", 404);
    }
    if (interest.status !== "pending") {
      return jsonError("This interest request is no longer pending", 400);
    }

    const [job, stylist] = await Promise.all([
      Job.findById(interest.jobId),
      Stylist.findById(session.stylistId),
    ]);

    if (!job || job.status !== "open") {
      interest.status = "cancelled";
      await interest.save();
      return jsonError("This position is no longer open", 400);
    }
    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }
    if (hasActiveEmploymentAtSalon(stylist, job.salonId.toString())) {
      interest.status = "cancelled";
      await interest.save();
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

      interest.status = "accepted";
      await interest.save();

      return jsonSuccess({
        interest: formatInterestRequestCard(interest),
        application: formatApplicationCard(application),
      });
    } catch (error) {
      const mongoError = error as { code?: number };
      if (mongoError.code === 11000) {
        interest.status = "accepted";
        await interest.save();
        const existing = await Application.findOne({
          jobId: job._id,
          stylistId: stylist._id,
        });
        return jsonSuccess({
          interest: formatInterestRequestCard(interest),
          application: existing
            ? formatApplicationCard(existing)
            : undefined,
          alreadyApplied: true,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Accept interest error:", error);
    return jsonError("Failed to send interest", 500);
  }
}
