import { NextRequest } from "next/server";
import { z } from "zod";
import {
  corsOptionsResponse,
  jsonError,
  jsonSuccess,
  zodErrorResponse,
} from "@/lib/api";
import { sendPhoneVerificationCode } from "@/lib/firebase-phone-auth";
import { indianMobileSchema } from "@/lib/validations";

const schema = z.object({
  phone: indianMobileSchema,
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

    const otpSession = await sendPhoneVerificationCode(parsed.data.phone);
    return jsonSuccess({ otpSession });
  } catch (error) {
    console.error("OTP send error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Could not send OTP. Please try again.";
    return jsonError(message, 400);
  }
}
