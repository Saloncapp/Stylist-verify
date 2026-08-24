import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { updateApplicationSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { formatApplicationCard } from "@/lib/hiring";
import Application from "@/models/Application";

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
    const parsed = updateApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const application = await Application.findOne({
      _id: id,
      salonId: session.salonId,
    });
    if (!application) {
      return jsonError("Application not found", 404);
    }

    const next = parsed.data.status;
    const current = application.status;

    if (next === current) {
      return jsonSuccess({ application: formatApplicationCard(application) });
    }

    if (next === "Hired") {
      return jsonError(
        "Use the hire flow to add this stylist to your salon before marking them as hired",
        400
      );
    }

    // Allowed: Interested -> Rejected; Rejected -> Interested
    const allowed =
      (current === "Interested" && next === "Rejected") ||
      (current === "Rejected" && next === "Interested");

    if (!allowed) {
      return jsonError(
        `Cannot change status from ${current} to ${next}`,
        400
      );
    }

    application.status = next;
    await application.save();

    return jsonSuccess({ application: formatApplicationCard(application) });
  } catch (error) {
    console.error("Update application error:", error);
    return jsonError("Failed to update application", 500);
  }
}
