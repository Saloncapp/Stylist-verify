import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { stylistSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { formatStylist } from "@/lib/formatters";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const stylists = await Stylist.find({ salonId: session.salonId }).sort({
      createdAt: -1,
    });

    const stats = {
      total: stylists.length,
      active: stylists.filter((s) => s.status === "Active").length,
      relieved: stylists.filter((s) => s.status === "Relieved").length,
      absconded: stylists.filter((s) => s.status === "Abscond").length,
    };

    return jsonSuccess({
      stats,
      stylists: stylists.map(formatStylist),
    });
  } catch (error) {
    console.error("List stylists error:", error);
    return jsonError("Failed to fetch stylists", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const body = await request.json();
    const parsed = stylistSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const data = parsed.data;

    if (
      (data.status === "Relieved" || data.status === "Abscond") &&
      (!data.remark || data.remark.trim().length < 5)
    ) {
      return jsonError("Remark is required for Relieved or Abscond status", 400);
    }

    await connectDB();

    const salon = await Salon.findById(session.salonId);
    if (!salon) {
      return jsonError("Salon not found", 404);
    }

    const existingAtSalon = await Stylist.findOne({
      aadhaarNumber: data.aadhaarNumber,
      salonId: salon._id,
    });
    if (existingAtSalon) {
      return jsonError(
        "This stylist is already registered at your salon",
        409
      );
    }

    const now = new Date();
    const historyEntry = {
      status: data.status,
      remark: data.remark,
      salonId: salon._id,
      salonName: salon.salonName,
      level: data.level,
      joiningDate: now,
      leavingDate:
        data.status === "Relieved" || data.status === "Abscond" ? now : undefined,
      updatedAt: now,
    };

    const stylist = await Stylist.create({
      salonId: salon._id,
      salonName: salon.salonName,
      name: data.name,
      mobileNumber: data.mobileNumber,
      level: data.level,
      aadhaarNumber: data.aadhaarNumber,
      address: data.address,
      photoUrl: data.photoUrl,
      status: data.status,
      joiningDate: now,
      leavingDate: historyEntry.leavingDate,
      employmentHistory: [historyEntry],
    });

    return jsonSuccess({ stylist: formatStylist(stylist) }, 201);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      return jsonError(
        "This stylist is already registered at your salon",
        409
      );
    }
    console.error("Create stylist error:", error);
    return jsonError("Failed to add stylist", 500);
  }
}
