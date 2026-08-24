import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSalonSession, toSalonUser } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import {
  normalizeOptionalUrl,
  parseEstablishmentYear,
} from "@/lib/salon-constants";
import { salonSnapshotFromSalon, syncSalonDetailsToStylists } from "@/lib/salon-sync";
import Salon from "@/models/Salon";

export async function GET() {
  try {
    const session = await requireSalonSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const salon = await Salon.findById(session.salonId);
    if (!salon) {
      return jsonError("Salon not found", 404);
    }

    return jsonSuccess({ salon: toSalonUser(salon) });
  } catch (error) {
    console.error("Get profile error:", error);
    return jsonError("Failed to fetch profile", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSalonSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const {
      salonName,
      ownerName,
      email,
      staffCount,
      salonType,
      logoUrl,
      salonAddress,
      googleMapsLocation,
      websiteUrl,
      instagramUrl,
      facebookUrl,
      whatsappNumber,
      youtubeUrl,
      establishmentYear: establishmentYearValue,
    } = parsed.data;

    const establishmentYear = parseEstablishmentYear(establishmentYearValue);

    await connectDB();

    const salon = await Salon.findById(session.salonId);
    if (!salon) {
      return jsonError("Salon not found", 404);
    }

    salon.salonName = salonName;
    salon.ownerName = ownerName ?? "";
    const nextEmail = email?.trim() ?? "";
    if (nextEmail) {
      salon.email = nextEmail;
    } else {
      salon.email = undefined;
    }
    salon.staffCount = staffCount;
    salon.salonType = salonType;
    salon.logoUrl = logoUrl ?? "";
    salon.salonAddress = salonAddress.trim();
    salon.googleMapsLocation = normalizeOptionalUrl(googleMapsLocation);
    salon.websiteUrl = normalizeOptionalUrl(websiteUrl);
    salon.instagramUrl = normalizeOptionalUrl(instagramUrl);
    salon.facebookUrl = normalizeOptionalUrl(facebookUrl);
    salon.whatsappNumber = whatsappNumber?.trim() ?? "";
    salon.youtubeUrl = normalizeOptionalUrl(youtubeUrl);
    salon.establishmentYear = establishmentYear;

    await salon.save();

    const unsetFields: Record<string, 1> = {};
    if (!nextEmail) unsetFields.email = 1;
    if (establishmentYear == null) unsetFields.establishmentYear = 1;

    if (Object.keys(unsetFields).length > 0) {
      await Salon.updateOne({ _id: salon._id }, { $unset: unsetFields });
      if (!nextEmail) salon.email = undefined;
      if (establishmentYear == null) salon.establishmentYear = undefined;
    }

    await syncSalonDetailsToStylists(salon._id, salonSnapshotFromSalon(salon));

    return jsonSuccess({ salon: toSalonUser(salon) });
  } catch (error) {
    console.error("Update profile error:", error);
    return jsonError("Failed to update profile", 500);
  }
}
