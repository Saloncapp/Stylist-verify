import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { sendPhoneVerificationCode } from "@/lib/firebase-phone-auth";
import { verifyPhoneChangeCurrentVerifiedToken } from "@/lib/phone-change-token";
import { assertNewPhoneAvailable, resolveAccountPhoneContext } from "@/lib/phone-change";
import { normalizeIndianMobile } from "@/lib/phone";
import { indianMobileSchema } from "@/lib/validations";

const schema = z.object({
  newPhone: indianMobileSchema,
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

    const verified = await verifyPhoneChangeCurrentVerifiedToken(
      parsed.data.currentVerifiedToken
    );
    if (!verified) {
      return jsonError(
        "Current number verification expired. Verify your current number again.",
        403
      );
    }
    if (
      verified.role !== account.role ||
      verified.accountId !== account.accountId ||
      verified.currentPhone !== account.currentPhone ||
      verified.uid !== account.uid
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

    const otpSession = await sendPhoneVerificationCode(newPhone);
    return jsonSuccess({ otpSession, phone: newPhone });
  } catch (error) {
    console.error("Phone change new send error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Could not send OTP. Please try again.";
    return jsonError(message, 400);
  }
}
