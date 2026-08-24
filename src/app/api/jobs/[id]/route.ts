import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { updateJobSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { formatJobCard } from "@/lib/hiring";
import Job from "@/models/Job";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateJobSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const job = await Job.findOne({ _id: id, salonId: session.salonId });
    if (!job) {
      return jsonError("Job not found", 404);
    }

    job.status = parsed.data.status;
    await job.save();

    return jsonSuccess({ job: formatJobCard(job) });
  } catch (error) {
    console.error("Update job error:", error);
    return jsonError("Failed to update job", 500);
  }
}
