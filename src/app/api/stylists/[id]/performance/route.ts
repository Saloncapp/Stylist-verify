import { calculateOverallPerformanceRating } from "@/lib/performance-ratings";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { formatStylist } from "@/lib/formatters";
import { performanceUpdateSchema } from "@/lib/validations";
import {
  findStylistForSalonQuery,
  getCurrentSalonEmployment,
  getSalonEmploymentEntries,
} from "@/lib/stylist-employment";
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
    const session = await requireSalonSession();
    if (!session?.salonId) {
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

    const stylist = await Stylist.findOne(
      findStylistForSalonQuery(id, session.salonId)
    );

    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    const salonEntries = getSalonEmploymentEntries(stylist, session.salonId);
    const current =
      getCurrentSalonEmployment(stylist, session.salonId) ?? salonEntries.at(-1);

    if (!current) {
      return jsonError("No employment record found at your salon", 404);
    }

    current.performanceSummary = performanceSummary;
    current.managerFeedback = managerFeedback;
    current.specialistServices = specialistServices;
    current.overallExperienceRating = overallExperienceRating;
    current.technicalSkillRating = technicalSkillRating;
    current.customerHandlingRating = customerHandlingRating;
    current.overallPerformanceRating = overallPerformanceRating;
    current.updatedAt = new Date();
    stylist.markModified("employmentHistory");

    await stylist.save();

    return jsonSuccess({
      stylist: formatStylist(stylist, session.salonId),
    });
  } catch (error) {
    console.error("Update performance error:", error);
    return jsonError("Failed to update performance information", 500);
  }
}
