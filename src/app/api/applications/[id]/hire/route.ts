import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { stylistCreateSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { formatApplicationCard } from "@/lib/hiring";
import { formatStylist } from "@/lib/formatters";
import {
  HireApplicantError,
  hireApplicantFromApplication,
} from "@/lib/hire-applicant";

export async function POST(
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
    const parsed = stylistCreateSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const result = await hireApplicantFromApplication({
      salonId: session.salonId,
      applicationId: id,
      data: parsed.data,
    });

    return jsonSuccess({
      application: formatApplicationCard(result.application),
      stylist: formatStylist(result.stylist, session.salonId),
    });
  } catch (error) {
    if (error instanceof HireApplicantError) {
      return jsonError(error.message, error.status);
    }
    console.error("Hire applicant error:", error);
    return jsonError("Failed to hire applicant", 500);
  }
}
