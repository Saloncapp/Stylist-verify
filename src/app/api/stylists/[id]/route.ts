import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { statusUpdateSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { formatStylist } from "@/lib/formatters";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const { id } = await params;
    await connectDB();

    const stylist = await Stylist.findOne({
      _id: id,
      salonId: session.salonId,
    });

    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    return jsonSuccess({ stylist: formatStylist(stylist) });
  } catch (error) {
    console.error("Get stylist error:", error);
    return jsonError("Failed to fetch stylist", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = statusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { status, remark } = parsed.data;

    await connectDB();

    const salon = await Salon.findById(session.salonId);
    if (!salon) {
      return jsonError("Salon not found", 404);
    }

    const stylist = await Stylist.findOne({
      _id: id,
      salonId: session.salonId,
    });

    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    if (stylist.status === status && status === "Active") {
      return jsonSuccess({ stylist: formatStylist(stylist) });
    }

    const now = new Date();
    stylist.status = status;

    if (status === "Relieved" || status === "Abscond") {
      stylist.leavingDate = now;
    } else if (status === "Active") {
      stylist.leavingDate = undefined;
    }

    stylist.employmentHistory.push({
      status,
      remark,
      salonId: salon._id,
      salonName: salon.salonName,
      level: stylist.level,
      joiningDate: stylist.joiningDate,
      leavingDate:
        status === "Relieved" || status === "Abscond" ? now : undefined,
      updatedAt: now,
    });

    await stylist.save();

    return jsonSuccess({ stylist: formatStylist(stylist) });
  } catch (error) {
    console.error("Update stylist error:", error);
    return jsonError("Failed to update stylist status", 500);
  }
}
