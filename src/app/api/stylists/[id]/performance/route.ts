import { calculateOverallPerformanceRating } from "@/lib/performance-ratings";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatStylist } from "@/lib/formatters";
import { performanceUpdateSchema } from "@/lib/validations";
import Stylist from "@/models/Stylist";
import { NextRequest } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function normalizeRating(value?: number | null): number | undefined {
  return value == null ? undefined : value;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = performanceUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const performanceSummary = parsed.data.performanceSummary?.trim() ?? "";
    const managerFeedback = parsed.data.managerFeedback?.trim() ?? "";
    const specialistServices = parsed.data.specialistServices ?? [];
    const overallExperienceRating = normalizeRating(
      parsed.data.overallExperienceRating
    );
    const technicalSkillRating = normalizeRating(
      parsed.data.technicalSkillRating
    );
    const customerHandlingRating = normalizeRating(
      parsed.data.customerHandlingRating
    );
    const overallPerformanceRating = calculateOverallPerformanceRating({
      overallExperienceRating,
      technicalSkillRating,
      customerHandlingRating,
    });

    await connectDB();

    const stylist = await Stylist.findOne({
      _id: id,
      salonId: session.salonId,
    });

    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    stylist.set({
      performanceSummary,
      managerFeedback,
      specialistServices,
      overallExperienceRating,
      technicalSkillRating,
      customerHandlingRating,
      overallPerformanceRating,
    });

    if (stylist.employmentHistory.length > 0) {
      for (const entry of stylist.employmentHistory) {
        entry.performanceSummary = performanceSummary;
        entry.managerFeedback = managerFeedback;
        entry.specialistServices = specialistServices;
        entry.overallExperienceRating = overallExperienceRating;
        entry.technicalSkillRating = technicalSkillRating;
        entry.customerHandlingRating = customerHandlingRating;
        entry.overallPerformanceRating = overallPerformanceRating;
        entry.updatedAt = new Date();
      }
      stylist.markModified("employmentHistory");
    }

    await stylist.save();

    return jsonSuccess({ stylist: formatStylist(stylist) });
  } catch (error) {
    console.error("Update performance error:", error);
    return jsonError("Failed to update performance information", 500);
  }
}
