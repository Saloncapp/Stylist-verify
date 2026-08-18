import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { documentUpdateSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { formatStylist } from "@/lib/formatters";
import Stylist from "@/models/Stylist";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = documentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const stylist = await Stylist.findOne({
      _id: id,
      salonId: session.salonId,
    });

    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    const experienceCertificateUrl =
      parsed.data.experienceCertificateUrl !== undefined
        ? parsed.data.experienceCertificateUrl.trim()
        : (stylist.experienceCertificateUrl ?? "");
    const relievingLetterUrl =
      parsed.data.relievingLetterUrl !== undefined
        ? parsed.data.relievingLetterUrl.trim()
        : (stylist.relievingLetterUrl ?? "");

    // Salon-scoped: only this salon's stylist enrollment is updated
    stylist.set({
      experienceCertificateUrl,
      relievingLetterUrl,
    });

    if (stylist.employmentHistory.length > 0) {
      for (const entry of stylist.employmentHistory) {
        entry.experienceCertificateUrl = experienceCertificateUrl;
        entry.relievingLetterUrl = relievingLetterUrl;
        entry.updatedAt = new Date();
      }
      stylist.markModified("employmentHistory");
    }

    await stylist.save();

    return jsonSuccess({ stylist: formatStylist(stylist) });
  } catch (error) {
    console.error("Update documents error:", error);
    return jsonError("Failed to update documents", 500);
  }
}
