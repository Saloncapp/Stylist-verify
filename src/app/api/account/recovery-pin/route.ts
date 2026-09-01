import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { resolveAccountPhoneContext } from "@/lib/phone-change";
import {
  getRecoveryPinStatus,
  isValidRecoveryPin,
  setRecoveryPin,
} from "@/lib/recovery-pin";
import { verifyRecoveryPinCurrentVerifiedToken } from "@/lib/recovery-pin-change-token";

const changeSchema = z
  .object({
    action: z.literal("change"),
    pin: z.string().regex(/^\d{6}$/, "Recovery PIN must be 6 digits"),
    confirmPin: z.string().regex(/^\d{6}$/, "Confirm your 6-digit PIN"),
    currentPinVerifiedToken: z
      .string()
      .min(1, "Verify your current recovery PIN first"),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PIN and confirmation do not match",
    path: ["confirmPin"],
  });

const createSchema = z
  .object({
    action: z.literal("create"),
    pin: z.string().regex(/^\d{6}$/, "Recovery PIN must be 6 digits"),
    confirmPin: z.string().regex(/^\d{6}$/, "Confirm your 6-digit PIN"),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PIN and confirmation do not match",
    path: ["confirmPin"],
  });

const schema = z.discriminatedUnion("action", [createSchema, changeSchema]);

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

    if (!isValidRecoveryPin(parsed.data.pin)) {
      return jsonError("Recovery PIN must be exactly 6 digits.", 400);
    }

    const account = await resolveAccountPhoneContext(session);
    if (!account) {
      return jsonError("Account not found", 404);
    }

    const status = await getRecoveryPinStatus(account.role, account.accountId);

    if (parsed.data.action === "create") {
      if (status.hasRecoveryPin) {
        return jsonError(
          "A recovery PIN already exists. Use Change Recovery PIN instead.",
          409
        );
      }
      await setRecoveryPin(
        { role: account.role, accountId: account.accountId },
        parsed.data.pin
      );
      return jsonSuccess({ hasRecoveryPin: true });
    }

    if (!status.hasRecoveryPin) {
      return jsonError(
        "No recovery PIN found. Create a new recovery PIN first.",
        404
      );
    }

    const verified = await verifyRecoveryPinCurrentVerifiedToken(
      parsed.data.currentPinVerifiedToken
    );
    if (!verified) {
      return jsonError(
        "Current PIN verification expired. Enter your current PIN again.",
        403
      );
    }
    if (
      verified.role !== account.role ||
      verified.accountId !== account.accountId
    ) {
      return jsonError("Current PIN verification is not valid.", 403);
    }

    await setRecoveryPin(
      { role: account.role, accountId: account.accountId },
      parsed.data.pin
    );

    return jsonSuccess({ hasRecoveryPin: true });
  } catch (error) {
    console.error("Recovery PIN update error:", error);
    return jsonError("Could not update recovery PIN. Please try again.", 500);
  }
}
