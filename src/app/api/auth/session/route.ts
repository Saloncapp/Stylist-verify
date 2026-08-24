import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  createSession,
  setSessionCookie,
  toSalonUser,
  toStylistAccount,
  homePathForRole,
} from "@/lib/auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { authSessionSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { normalizeIndianMobile } from "@/lib/phone";
import { maskAadhaar, getAadhaarFromRecord } from "@/lib/aadhaar-crypto";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = authSessionSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const decoded = await verifyFirebaseIdToken(parsed.data.idToken);
    const phone = decoded.phone_number
      ? normalizeIndianMobile(decoded.phone_number)
      : null;
    if (!phone) {
      return jsonError("Phone number was not verified", 400);
    }

    await connectDB();

    const salon = await Salon.findOne({ salonNumber: phone });
    if (salon) {
      salon.firebaseUid = decoded.uid;
      await salon.save();

      const token = await createSession({
        uid: decoded.uid,
        role: "salon",
        phone,
        salonId: salon._id.toString(),
      });
      await setSessionCookie(token);

      return jsonSuccess({
        role: "salon" as const,
        redirectTo: homePathForRole("salon"),
        salon: toSalonUser(salon),
      });
    }

    const stylist = await Stylist.findOne({ mobileNumber: phone });
    if (stylist) {
      stylist.firebaseUid = decoded.uid;
      await stylist.save();

      let aadhaarMasked: string | undefined;
      try {
        aadhaarMasked = maskAadhaar(getAadhaarFromRecord(stylist));
      } catch {
        aadhaarMasked = undefined;
      }

      const token = await createSession({
        uid: decoded.uid,
        role: "stylist",
        phone,
        stylistId: stylist._id.toString(),
      });
      await setSessionCookie(token);

      return jsonSuccess({
        role: "stylist" as const,
        redirectTo: homePathForRole("stylist"),
        stylist: toStylistAccount({
          ...stylist.toObject(),
          aadhaarMasked,
        }),
      });
    }

    return jsonSuccess({
      needsRegistration: true,
      phone,
      uid: decoded.uid,
    });
  } catch (error) {
    console.error("Auth session error:", error);
    return jsonError("Failed to create session. Please try again.", 500);
  }
}
