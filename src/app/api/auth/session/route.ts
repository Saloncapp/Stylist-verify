import { NextRequest } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { resolvePhoneAuthSession } from "@/lib/phone-auth-session";
import { authSessionSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { normalizeIndianMobile } from "@/lib/phone";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = authSessionSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const decoded = await verifyFirebaseIdToken(parsed.data.idToken);
    const phone = decoded.phone_number
      ? normalizeIndianMobile(decoded.phone_number)
      : null;
    if (!phone) {
      return jsonError("Phone number was not verified", 400);
    }

    const session = await resolvePhoneAuthSession(decoded.uid, phone);
    return jsonSuccess(session);
  } catch (error) {
    console.error("Auth session error:", error);
    return jsonError("Failed to create session. Please try again.", 500);
  }
}
