import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSalonSession } from "@/lib/auth";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { sendPhoneVerificationCode } from "@/lib/firebase-phone-auth";
import { normalizeIndianMobile } from "@/lib/phone";
import { indianMobileSchema } from "@/lib/validations";

const schema = z.object({
  phone: indianMobileSchema,
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

    const otpSession = await sendPhoneVerificationCode(phone);
    return jsonSuccess({ otpSession, phone });
  } catch (error) {
    console.error("Salon stylist phone send OTP error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Could not send OTP. Please try again.";
    return jsonError(message, 400);
  }
}
