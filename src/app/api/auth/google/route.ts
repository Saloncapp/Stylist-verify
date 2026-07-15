import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { createSession, setSessionCookie, toSalonUser } from "@/lib/auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { googleAuthSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import Salon from "@/models/Salon";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = googleAuthSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const decoded = await verifyFirebaseIdToken(parsed.data.idToken);

    if (!decoded.email) {
      return jsonError("Google account must have a verified email", 400);
    }

    const googleUid = decoded.uid;
    const email = decoded.email.toLowerCase();
    const displayName = decoded.name ?? "";

    await connectDB();

    let salon = await Salon.findOne({ googleUid });

    if (!salon) {
      salon = await Salon.findOne({ email });
    }

    if (salon) {
      if (salon.authProvider === "email") {
        return jsonError(
          "An account with this email already exists. Please sign in with your password.",
          409
        );
      }

      if (!salon.googleUid) {
        salon.googleUid = googleUid;
        await salon.save();
      }

      const token = await createSession({
        salonId: salon._id.toString(),
        email: salon.email,
      });
      await setSessionCookie(token);

      return jsonSuccess({ salon: toSalonUser(salon), needsProfile: false });
    }

    return jsonSuccess({
      needsProfile: true,
      email,
      ownerName: displayName,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return jsonError("Google sign-in failed. Please try again.", 500);
  }
}
