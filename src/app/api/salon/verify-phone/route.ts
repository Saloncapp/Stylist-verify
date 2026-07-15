import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession, toSalonUser } from "@/lib/auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { verifyPhoneSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import Salon from "@/models/Salon";

function normalizeIndianMobile(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0") && /^[6-9]\d{9}$/.test(digits.slice(1))) {
    return digits.slice(1);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const body = await request.json();
    const parsed = verifyPhoneSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { idToken, salonNumber } = parsed.data;
    const decoded = await verifyFirebaseIdToken(idToken);

    const tokenPhone = decoded.phone_number;
    if (!tokenPhone) {
      return jsonError("Phone number was not verified with Firebase", 400);
    }

    const verifiedMobile = normalizeIndianMobile(tokenPhone);
    if (!verifiedMobile) {
      return jsonError("Verified phone number is not a valid Indian mobile number", 400);
    }

    if (verifiedMobile !== salonNumber) {
      return jsonError(
        "Verified phone number does not match the salon number you entered",
        400
      );
    }

    await connectDB();

    const salon = await Salon.findById(session.salonId);
    if (!salon) {
      return jsonError("Salon not found", 404);
    }

    salon.salonNumber = verifiedMobile;
    salon.salonNumberVerified = true;
    await salon.save();

    return jsonSuccess({
      salon: toSalonUser(salon),
      message: "Salon number verified successfully",
    });
  } catch (error) {
    console.error("Verify phone error:", error);
    return jsonError("Failed to verify phone number. Please try again.", 500);
  }
}
