import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession, toSalonUser } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { normalizeOptionalUrl, parseEstablishmentYear } from "@/lib/salon-constants";
import { salonSnapshotFromSalon, syncSalonDetailsToStylists } from "@/lib/salon-sync";
import Salon from "@/models/Salon";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const salon = await Salon.findById(session.salonId).select("-password");
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
    const session = await getSession();
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
      salonNumber,
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

    const normalizedEmail = email.toLowerCase();

    if (normalizedEmail !== salon.email) {
      const emailTaken = await Salon.findOne({
        email: normalizedEmail,
        _id: { $ne: salon._id },
      });
      if (emailTaken) {
        return jsonError("An account with this email already exists", 409);
      }
    }

    const previousEmail = salon.email.toLowerCase();
    const previousSalonNumber = salon.salonNumber ?? "";
    const shouldUnlinkGoogle =
      normalizedEmail !== previousEmail &&
      Boolean(salon.googleUid) &&
      salon.authProvider === "email";

    salon.salonName = salonName;
    salon.ownerName = ownerName;
    salon.email = normalizedEmail;
    salon.staffCount = staffCount;
    salon.salonNumber = salonNumber;
    salon.salonType = salonType;
    salon.logoUrl = logoUrl ?? "";
    salon.salonAddress = salonAddress?.trim() ?? "";
    salon.googleMapsLocation = normalizeOptionalUrl(googleMapsLocation);
    salon.websiteUrl = normalizeOptionalUrl(websiteUrl);
    salon.instagramUrl = normalizeOptionalUrl(instagramUrl);
    salon.facebookUrl = normalizeOptionalUrl(facebookUrl);
    salon.whatsappNumber = whatsappNumber?.trim() ?? "";
    salon.youtubeUrl = normalizeOptionalUrl(youtubeUrl);
    salon.establishmentYear = establishmentYear;

    if (salonNumber !== previousSalonNumber) {
      salon.salonNumberVerified = false;
    }

    await salon.save();

    if (establishmentYear == null) {
      await Salon.updateOne(
        { _id: salon._id },
        { $unset: { establishmentYear: 1 } }
      );
      salon.establishmentYear = undefined;
    }

    if (shouldUnlinkGoogle) {
      await Salon.updateOne({ _id: salon._id }, { $unset: { googleUid: 1 } });
      salon.googleUid = undefined;
    }

    await syncSalonDetailsToStylists(salon._id, salonSnapshotFromSalon(salon));

    return jsonSuccess({ salon: toSalonUser(salon) });
  } catch (error) {
    console.error("Update profile error:", error);
    return jsonError("Failed to update profile", 500);
  }
}
