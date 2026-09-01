import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { verifyPhoneVerificationCode } from "@/lib/firebase-phone-auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import {
  createPhoneChangeReadyToken,
  verifyPhoneChangeCurrentVerifiedToken,
} from "@/lib/phone-change-token";
import {
  assertNewPhoneAvailable,
  resolveAccountPhoneContext,
} from "@/lib/phone-change";
import { normalizeIndianMobile } from "@/lib/phone";
import { indianMobileSchema } from "@/lib/validations";

const schema = z.object({
  newPhone: indianMobileSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
  otpSession: z.string().min(1, "OTP session is required"),
  currentVerifiedToken: z.string().min(1, "Verify your current number first"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const account = await resolveAccountPhoneContext(session);
    if (!account) {
      return jsonError("Account not found", 404);
    }

    const currentVerified = await verifyPhoneChangeCurrentVerifiedToken(
      parsed.data.currentVerifiedToken
    );
    if (!currentVerified) {
      return jsonError(
        "Current number verification expired. Verify your current number again.",
        403
      );
    }
    if (
      currentVerified.role !== account.role ||
      currentVerified.accountId !== account.accountId ||
      currentVerified.currentPhone !== account.currentPhone ||
      currentVerified.uid !== account.uid
    ) {
      return jsonError("Current number verification is not valid.", 403);
    }

    const newPhone = normalizeIndianMobile(parsed.data.newPhone);
    if (!newPhone) {
      return jsonError("Enter a valid 10-digit mobile number.", 400);
    }
    if (newPhone === account.currentPhone) {
      return jsonError("New number must be different from your current number.", 400);
    }

    const availability = await assertNewPhoneAvailable({
      role: account.role,
      accountId: account.accountId,
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

    const changeReadyToken = await createPhoneChangeReadyToken({
      role: account.role,
      accountId: account.accountId,
      currentPhone: account.currentPhone,
      newPhone,
      uid: account.uid,
      newFirebaseUid,
    });

    return jsonSuccess({
      changeReadyToken,
      currentPhone: account.currentPhone,
      newPhone,
    });
  } catch (error) {
    console.error("Phone change new verify error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "OTP verification failed. Please try again.";
    return jsonError(message, 400);
  }
}
