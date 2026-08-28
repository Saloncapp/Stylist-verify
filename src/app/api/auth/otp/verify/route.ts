import { NextRequest } from "next/server";
import { z } from "zod";
import {
  corsOptionsResponse,
  jsonError,
  jsonSuccess,
  zodErrorResponse,
} from "@/lib/api";
import { verifyPhoneVerificationCode } from "@/lib/firebase-phone-auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { resolvePhoneAuthSession } from "@/lib/phone-auth-session";
import { normalizeIndianMobile } from "@/lib/phone";
import { indianMobileSchema } from "@/lib/validations";

const schema = z.object({
  phone: indianMobileSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
  otpSession: z.string().min(1, "OTP session is required"),
});

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const phone = normalizeIndianMobile(parsed.data.phone);
    if (!phone) {
      return jsonError("Invalid phone number. Use a valid 10-digit Indian mobile.", 400);
    }

    const { idToken } = await verifyPhoneVerificationCode(
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

    const session = await resolvePhoneAuthSession(decoded.uid, verifiedPhone);
    return jsonSuccess(session);
  } catch (error) {
    console.error("OTP verify error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "OTP verification failed. Please try again.";
    return jsonError(message, 400);
  }
}
