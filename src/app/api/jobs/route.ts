import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSalonSession, requireStylistSession } from "@/lib/auth";
import { createJobSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import {
  activeSalonIdsForStylist,
  buildJobSalonSnapshot,
  decodeHiringCursor,
  encodeHiringCursor,
  formatJobCard,
  hiringCursorFilter,
  parseHiringLimit,
} from "@/lib/hiring";
import Application from "@/models/Application";
import Job from "@/models/Job";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

/** Open jobs for stylists (excludes current Active employers). */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseHiringLimit(searchParams.get("limit"));
    const cursor = decodeHiringCursor(searchParams.get("cursor"));
    const excludeSalonIds = activeSalonIdsForStylist(stylist);

    const filter: Record<string, unknown> = {
      status: "open",
      ...(excludeSalonIds.length > 0
        ? { salonId: { $nin: excludeSalonIds } }
        : {}),
      ...hiringCursorFilter(cursor),
    };

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const page = jobs.slice(0, limit);
    const jobIds = page.map((j) => j._id);
    const applied = await Application.find({
      stylistId: session.stylistId,
      jobId: { $in: jobIds },
    })
      .select("jobId")
      .lean();
    const appliedSet = new Set(applied.map((a) => a.jobId.toString()));

    const items = page.map((job) =>
      formatJobCard(job as never, appliedSet.has(job._id.toString()))
    );

    const last = page[page.length - 1];
    const nextCursor =
      jobs.length > limit && last
        ? encodeHiringCursor(last.createdAt, last._id.toString())
        : null;

    return jsonSuccess({ items, nextCursor });
  } catch (error) {
    console.error("List jobs error:", error);
    return jsonError("Failed to load jobs", 500);
  }
}

/** Create a job posting (salon). */
export async function POST(request: NextRequest) {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    const body = await request.json();
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const salon = await Salon.findById(session.salonId);
    if (!salon) {
      return jsonError("Salon not found", 404);
    }

    const job = await Job.create({
      salonId: salon._id,
      salonSnapshot: buildJobSalonSnapshot(salon),
      role: parsed.data.role,
      employmentType: parsed.data.employmentType,
      level: parsed.data.level,
      description: parsed.data.description.trim(),
      status: "open",
    });

    return jsonSuccess({ job: formatJobCard(job) }, 201);
  } catch (error) {
    console.error("Create job error:", error);
    return jsonError("Failed to create job", 500);
  }
}
