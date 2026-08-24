import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStylistSession, toStylistAccount } from "@/lib/auth";
import { stylistSelfUpdateSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { getAadhaarFromRecord, maskAadhaar } from "@/lib/aadhaar-crypto";
import { buildPrivateVerifiedStylistFromRecords } from "@/lib/verify";
import Stylist from "@/models/Stylist";

export async function GET() {
  try {
    const session = await requireStylistSession();
    if (!session?.stylistId) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const stylist = await Stylist.findById(session.stylistId);
    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    let aadhaarMasked: string | undefined;
    try {
      aadhaarMasked = maskAadhaar(getAadhaarFromRecord(stylist));
    } catch {
      aadhaarMasked = undefined;
    }

    const verified = buildPrivateVerifiedStylistFromRecords([stylist]);

    return jsonSuccess({
      stylist: toStylistAccount({
        ...stylist.toObject(),
        aadhaarMasked,
      }),
      employmentHistory: verified.employmentHistory,
    });
  } catch (error) {
    console.error("Get me stylist error:", error);
    return jsonError("Failed to fetch stylist profile", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireStylistSession();
    if (!session?.stylistId) {
      return jsonError("Not authenticated", 401);
    }

    const body = await request.json();
    const parsed = stylistSelfUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { name, address, photoUrl, openToWork } = parsed.data;

    await connectDB();

    const stylist = await Stylist.findById(session.stylistId);
    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    if (typeof openToWork === "boolean") {
      stylist.openToWork = openToWork;
      stylist.openToWorkAt = openToWork ? new Date() : undefined;
    }

    if (name !== undefined) {
      stylist.name = name.trim();
    }
    if (address !== undefined) {
      stylist.address = address.trim();
    }
    if (photoUrl !== undefined) {
      stylist.photoUrl = photoUrl.trim();
    }

    await stylist.save();

    let aadhaarMasked: string | undefined;
    try {
      aadhaarMasked = maskAadhaar(getAadhaarFromRecord(stylist));
    } catch {
      aadhaarMasked = undefined;
    }

    return jsonSuccess({
      stylist: toStylistAccount({
        ...stylist.toObject(),
        aadhaarMasked,
      }),
    });
  } catch (error) {
    console.error("Update me stylist error:", error);
    return jsonError("Failed to update stylist profile", 500);
  }
}
