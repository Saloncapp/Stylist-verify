import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession, toSalonUser } from "@/lib/auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { linkGoogleSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import Salon from "@/models/Salon";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const body = await request.json();
    const parsed = linkGoogleSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const decoded = await verifyFirebaseIdToken(parsed.data.idToken);

    if (!decoded.email) {
      return jsonError("Google account must have a verified email", 400);
    }

    const googleEmail = decoded.email.toLowerCase();
    const googleUid = decoded.uid;

    await connectDB();

    const salon = await Salon.findById(session.salonId);
    if (!salon) {
      return jsonError("Salon not found", 404);
    }

    if (salon.authProvider === "google" || salon.googleUid) {
      return jsonSuccess({
        salon: toSalonUser(salon),
        message: "Google account already connected",
      });
    }

    if (googleEmail !== salon.email.toLowerCase()) {
      return jsonError(
        `Google email (${googleEmail}) must match your salon email (${salon.email})`,
        400
      );
    }

    const uidTaken = await Salon.findOne({
      googleUid,
      _id: { $ne: salon._id },
    });
    if (uidTaken) {
      return jsonError("This Google account is already linked to another salon", 409);
    }

    salon.googleUid = googleUid;
    await salon.save();

    return jsonSuccess({
      salon: toSalonUser(salon),
      message: "Google account connected successfully",
    });
  } catch (error) {
    console.error("Link Google error:", error);
    return jsonError("Failed to connect Google account. Please try again.", 500);
  }
}
