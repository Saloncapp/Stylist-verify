import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { verifyPhoneVerificationCode } from "@/lib/firebase-phone-auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { createPhoneChangeCurrentVerifiedToken } from "@/lib/phone-change-token";
import { resolveAccountPhoneContext } from "@/lib/phone-change";
import { normalizeIndianMobile } from "@/lib/phone";

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
  otpSession: z.string().min(1, "OTP session is required"),
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

    const { idToken } = await verifyPhoneVerificationCode(
      parsed.data.otpSession,
      parsed.data.code
    );

    const decoded = await verifyFirebaseIdToken(idToken);
    const verifiedPhone = decoded.phone_number
      ? normalizeIndianMobile(decoded.phone_number)
      : null;

    if (!verifiedPhone || verifiedPhone !== account.currentPhone) {
      return jsonError("Phone number does not match your registered number.", 400);
    }

    const currentVerifiedToken = await createPhoneChangeCurrentVerifiedToken({
      role: account.role,
      accountId: account.accountId,
      currentPhone: account.currentPhone,
      uid: account.uid,
    });

    return jsonSuccess({
      currentVerifiedToken,
      phone: account.currentPhone,
    });
  } catch (error) {
    console.error("Phone change current verify error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "OTP verification failed. Please try again.";
    return jsonError(message, 400);
  }
}
