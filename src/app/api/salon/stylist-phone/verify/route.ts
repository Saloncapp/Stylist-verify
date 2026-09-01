import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSalonSession } from "@/lib/auth";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { verifyPhoneVerificationCode } from "@/lib/firebase-phone-auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { createSalonStylistPhoneVerificationToken } from "@/lib/phone-verification-token";
import { normalizeIndianMobile } from "@/lib/phone";
import { indianMobileSchema } from "@/lib/validations";

const schema = z.object({
  phone: indianMobileSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
  otpSession: z.string().min(1, "OTP session is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const phone = normalizeIndianMobile(parsed.data.phone);
    if (!phone) {
      return jsonError("Enter a valid 10-digit mobile number", 400);
    }

    const { idToken, uid } = await verifyPhoneVerificationCode(
      parsed.data.otpSession,
      parsed.data.code
    );

    const decoded = await verifyFirebaseIdToken(idToken);
    const verifiedPhone = decoded.phone_number
      ? normalizeIndianMobile(decoded.phone_number)
      : null;

    if (!verifiedPhone || verifiedPhone !== phone) {
      return jsonError("Phone number does not match the verified OTP.", 400);
    }

    const phoneVerificationToken = await createSalonStylistPhoneVerificationToken(
      {
        salonId: session.salonId,
        phone: verifiedPhone,
        uid,
      }
    );

    return jsonSuccess({
      phone: verifiedPhone,
      phoneVerificationToken,
    });
  } catch (error) {
    console.error("Salon stylist phone verify error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "OTP verification failed. Please try again.";
    return jsonError(message, 400);
  }
}
