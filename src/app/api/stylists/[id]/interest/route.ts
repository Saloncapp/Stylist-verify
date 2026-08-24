import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import {
  buildInterestMessage,
  formatInterestRequestCard,
  getLatestRole,
} from "@/lib/hiring";
import { hasActiveEmploymentAtSalon } from "@/lib/stylist-employment";
import { sendInterestSchema } from "@/lib/validations";
import Application from "@/models/Application";
import InterestRequest from "@/models/InterestRequest";
import Job from "@/models/Job";
import Stylist from "@/models/Stylist";

/**
 * Jobs this salon already contacted this stylist about
 * (pending interest or existing application).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    const { id: stylistId } = await context.params;
    await connectDB();

    const [pendingInterests, applications] = await Promise.all([
      InterestRequest.find({
        salonId: session.salonId,
        stylistId,
        status: "pending",
      })
        .select("jobId")
        .lean(),
      Application.find({
        salonId: session.salonId,
        stylistId,
      })
        .select("jobId")
        .lean(),
    ]);

    const sentJobIds = [
      ...new Set([
        ...pendingInterests.map((row) => row.jobId.toString()),
        ...applications.map((row) => row.jobId.toString()),
      ]),
    ];

    return jsonSuccess({ sentJobIds });
  } catch (error) {
    console.error("List sent interest jobs error:", error);
    return jsonError("Failed to load interest status", 500);
  }
}

/** Salon sends an interest request to an Open to Work stylist for a job. */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    const { id: stylistId } = await context.params;
    const body = await request.json();
    const parsed = sendInterestSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const [job, stylist] = await Promise.all([
      Job.findOne({
        _id: parsed.data.jobId,
        salonId: session.salonId,
      }),
      Stylist.findById(stylistId),
    ]);

    if (!job || job.status !== "open") {
      return jsonError("Select an open job position from your salon", 400);
    }
    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }
    if (!stylist.openToWork) {
      return jsonError("This stylist is not Open to Work", 400);
    }
    if (hasActiveEmploymentAtSalon(stylist, session.salonId)) {
      return jsonError("This stylist already works at your salon", 400);
    }

    const existingApplication = await Application.findOne({
      jobId: job._id,
      stylistId: stylist._id,
    })
      .select("_id")
      .lean();
    if (existingApplication) {
      return jsonError(
        "An application already exists for this stylist and job",
        409
      );
    }

    const existingPending = await InterestRequest.findOne({
      jobId: job._id,
      stylistId: stylist._id,
      status: "pending",
    })
      .select("_id")
      .lean();
    if (existingPending) {
      return jsonError(
        "You already sent an interest request for this position",
        409
      );
    }

    try {
      const interest = await InterestRequest.create({
        jobId: job._id,
        stylistId: stylist._id,
        salonId: job.salonId,
        status: "pending",
        message: buildInterestMessage(job.role),
        jobSnapshot: {
          role: job.role,
          employmentType: job.employmentType || "",
          salonName: job.salonSnapshot.salonName,
          salonAddress: job.salonSnapshot.salonAddress || "",
          salonLogoUrl: job.salonSnapshot.salonLogoUrl || "",
        },
        stylistSnapshot: {
          name: stylist.name,
          mobileNumber: stylist.mobileNumber,
          photoUrl: stylist.photoUrl || "",
          latestRole: getLatestRole(stylist),
        },
      });

      return jsonSuccess(
        { interest: formatInterestRequestCard(interest) },
        201
      );
    } catch (error) {
      const mongoError = error as { code?: number };
      if (mongoError.code === 11000) {
        return jsonError(
          "You already sent an interest request for this position",
          409
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Send interest error:", error);
    return jsonError("Failed to send interest request", 500);
  }
}
