import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { documentUpdateSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { formatStylist } from "@/lib/formatters";
import {
  findStylistForSalonQuery,
  getCurrentSalonEmployment,
  getSalonEmploymentEntries,
} from "@/lib/stylist-employment";
import Stylist from "@/models/Stylist";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = documentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const stylist = await Stylist.findOne(
      findStylistForSalonQuery(id, session.salonId)
    );

    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    const current =
      getCurrentSalonEmployment(stylist, session.salonId) ??
      getSalonEmploymentEntries(stylist, session.salonId).at(-1);

    if (!current) {
      return jsonError("No employment record found at your salon", 404);
    }

    const experienceCertificateUrl =
      parsed.data.experienceCertificateUrl !== undefined
        ? parsed.data.experienceCertificateUrl.trim()
        : (current.experienceCertificateUrl ?? "");
    const relievingLetterUrl =
      parsed.data.relievingLetterUrl !== undefined
        ? parsed.data.relievingLetterUrl.trim()
        : (current.relievingLetterUrl ?? "");

    current.experienceCertificateUrl = experienceCertificateUrl;
    current.relievingLetterUrl = relievingLetterUrl;
    current.updatedAt = new Date();
    stylist.markModified("employmentHistory");

    await stylist.save();

    return jsonSuccess({
      stylist: formatStylist(stylist, session.salonId),
    });
  } catch (error) {
    console.error("Update documents error:", error);
    return jsonError("Failed to update documents", 500);
  }
}
