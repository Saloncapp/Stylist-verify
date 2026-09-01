import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { sendPhoneVerificationCode } from "@/lib/firebase-phone-auth";
import { resolveAccountPhoneContext } from "@/lib/phone-change";

function maskPhone(phone: string) {
  if (phone.length !== 10) return phone;
  return `${phone.slice(0, 2)}******${phone.slice(-2)}`;
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const account = await resolveAccountPhoneContext(session);
    if (!account) {
      return jsonError("Account not found", 404);
    }

    const otpSession = await sendPhoneVerificationCode(account.currentPhone);
    return jsonSuccess({
      otpSession,
      phone: account.currentPhone,
      maskedPhone: maskPhone(account.currentPhone),
    });
  } catch (error) {
    console.error("Phone change current send error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Could not send OTP. Please try again.";
    return jsonError(message, 400);
  }
}
