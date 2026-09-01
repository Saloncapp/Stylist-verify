import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { verifyAccountRecoveryPinVerifiedToken } from "@/lib/account-recovery-token";
import { assertNewPhoneAvailable } from "@/lib/phone-change";
import { sendPhoneVerificationCode } from "@/lib/firebase-phone-auth";
import { normalizeIndianMobile } from "@/lib/phone";
import { indianMobileSchema } from "@/lib/validations";

const schema = z.object({
  pinVerifiedToken: z.string().min(1, "Verify your recovery PIN first"),
  newPhone: indianMobileSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const verified = await verifyAccountRecoveryPinVerifiedToken(
      parsed.data.pinVerifiedToken
    );
    if (!verified) {
      return jsonError(
        "Recovery verification expired. Start account recovery again.",
        403
      );
    }

    const newPhone = normalizeIndianMobile(parsed.data.newPhone);
    if (!newPhone) {
      return jsonError("Enter a valid 10-digit mobile number.", 400);
    }
    if (newPhone === verified.oldPhone) {
      return jsonError(
        "New number must be different from your registered number.",
        400
      );
    }

    const availability = await assertNewPhoneAvailable({
      role: verified.role,
      accountId: verified.accountId,
      newPhone,
    });
    if (!availability.ok) {
      return jsonError(availability.message, 409);
    }

    const otpSession = await sendPhoneVerificationCode(newPhone);
    return jsonSuccess({ otpSession, newPhone, oldPhone: verified.oldPhone });
  } catch (error) {
    console.error("Account recovery new phone send error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Could not send OTP. Please try again.";
    return jsonError(message, 400);
  }
}
