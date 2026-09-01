import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { resolveAccountPhoneContext } from "@/lib/phone-change";
import {
  getRecoveryPinStatus,
  isValidRecoveryPin,
  verifyRecoveryPin,
} from "@/lib/recovery-pin";
import { createRecoveryPinCurrentVerifiedToken } from "@/lib/recovery-pin-change-token";
import { connectDB } from "@/lib/db";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

const schema = z.object({
  currentPin: z.string().regex(/^\d{6}$/, "Enter your 6-digit recovery PIN"),
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

    if (!isValidRecoveryPin(parsed.data.currentPin)) {
      return jsonError("Recovery PIN must be exactly 6 digits.", 400);
    }

    const account = await resolveAccountPhoneContext(session);
    if (!account) {
      return jsonError("Account not found", 404);
    }

    const status = await getRecoveryPinStatus(account.role, account.accountId);
    if (!status.hasRecoveryPin) {
      return jsonError(
        "No recovery PIN found. Create a new recovery PIN first.",
        404
      );
    }

    await connectDB();
    const record =
      account.role === "salon"
        ? await Salon.findById(account.accountId)
            .select("+recoveryPinHash")
            .lean()
        : await Stylist.findById(account.accountId)
            .select("+recoveryPinHash")
            .lean();

    const hash = record?.recoveryPinHash;
    if (!hash) {
      return jsonError("Recovery PIN not found.", 404);
    }

    const valid = await verifyRecoveryPin(parsed.data.currentPin, hash);
    if (!valid) {
      return jsonError("Current recovery PIN is incorrect.", 403);
    }

    const currentPinVerifiedToken = await createRecoveryPinCurrentVerifiedToken({
      role: account.role,
      accountId: account.accountId,
    });

    return jsonSuccess({ currentPinVerifiedToken });
  } catch (error) {
    console.error("Recovery PIN verify current error:", error);
    return jsonError("Could not verify recovery PIN. Please try again.", 500);
  }
}
