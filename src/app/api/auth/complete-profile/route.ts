import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { createSession, setSessionCookie, toSalonUser } from "@/lib/auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { completeGoogleProfileSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import Salon from "@/models/Salon";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = completeGoogleProfileSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { idToken, salonName, ownerName, staffCount, location, salonNumber } =
      parsed.data;

    const decoded = await verifyFirebaseIdToken(idToken);

    if (!decoded.email) {
      return jsonError("Google account must have a verified email", 400);
    }

    const googleUid = decoded.uid;
    const email = decoded.email.toLowerCase();

    await connectDB();

    const existingByUid = await Salon.findOne({ googleUid });
    if (existingByUid) {
      const token = await createSession({
        salonId: existingByUid._id.toString(),
        email: existingByUid.email,
      });
      await setSessionCookie(token);
      return jsonSuccess({ salon: toSalonUser(existingByUid) });
    }

    const existingByEmail = await Salon.findOne({ email });
    if (existingByEmail) {
      if (existingByEmail.authProvider === "email") {
        return jsonError(
          "An account with this email already exists. Please sign in with your password.",
          409
        );
      }
      return jsonError("Account already exists. Please sign in.", 409);
    }

    const salon = await Salon.create({
      salonName,
      ownerName,
      email,
      authProvider: "google",
      googleUid,
      staffCount,
      location,
      salonNumber,
    });

    const token = await createSession({
      salonId: salon._id.toString(),
      email: salon.email,
    });
    await setSessionCookie(token);

    return jsonSuccess({ salon: toSalonUser(salon) }, 201);
  } catch (error) {
    console.error("Complete Google profile error:", error);
    return jsonError("Failed to complete registration. Please try again.", 500);
  }
}
