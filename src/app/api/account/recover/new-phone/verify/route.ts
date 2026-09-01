import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import {
  createAccountRecoveryReadyToken,
  verifyAccountRecoveryPinVerifiedToken,
} from "@/lib/account-recovery-token";
import { assertNewPhoneAvailable } from "@/lib/phone-change";
import { verifyPhoneVerificationCode } from "@/lib/firebase-phone-auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { normalizeIndianMobile } from "@/lib/phone";
import { indianMobileSchema } from "@/lib/validations";

const schema = z.object({
  pinVerifiedToken: z.string().min(1, "Verify your recovery PIN first"),
  newPhone: indianMobileSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
  otpSession: z.string().min(1, "OTP session is required"),
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

    const { idToken, uid: newFirebaseUid } = await verifyPhoneVerificationCode(
      parsed.data.otpSession,
      parsed.data.code
    );

    const decoded = await verifyFirebaseIdToken(idToken);
    const verifiedNewPhone = decoded.phone_number
      ? normalizeIndianMobile(decoded.phone_number)
      : null;

    if (!verifiedNewPhone || verifiedNewPhone !== newPhone) {
      return jsonError("Phone number does not match the verified OTP.", 400);
    }

    const recoveryReadyToken = await createAccountRecoveryReadyToken({
      role: verified.role,
      accountId: verified.accountId,
      oldPhone: verified.oldPhone,
      newPhone,
      uid: verified.uid,
      newFirebaseUid,
    });

    return jsonSuccess({
      recoveryReadyToken,
      oldPhone: verified.oldPhone,
      newPhone,
    });
  } catch (error) {
    console.error("Account recovery new phone verify error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "OTP verification failed. Please try again.";
    return jsonError(message, 400);
  }
}
