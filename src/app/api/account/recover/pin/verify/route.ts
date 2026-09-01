import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { createAccountRecoveryPinVerifiedToken } from "@/lib/account-recovery-token";
import {
  findAccountByPhone,
  isRecoveryPinLocked,
  recordRecoveryPinFailure,
  recoveryPinLockMessage,
  resetRecoveryPinAttempts,
  verifyRecoveryPin,
} from "@/lib/recovery-pin";
import { indianMobileSchema } from "@/lib/validations";

const schema = z.object({
  phone: indianMobileSchema,
  pin: z.string().regex(/^\d{6}$/, "Enter your 6-digit recovery PIN"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const account = await findAccountByPhone(parsed.data.phone);
    if (!account) {
      return jsonError(
        "No account found for this mobile number.",
        404
      );
    }

    if (!account.recoveryPinHash) {
      return jsonError(
        "This account does not have a recovery PIN. Contact support or sign in with your registered number.",
        403
      );
    }

    if (isRecoveryPinLocked(account)) {
      return jsonError(
        recoveryPinLockMessage(account.recoveryPinLockedUntil!),
        429
      );
    }

    const valid = await verifyRecoveryPin(
      parsed.data.pin,
      account.recoveryPinHash
    );

    if (!valid) {
      const failure = await recordRecoveryPinFailure(account);
      if (failure.locked && failure.lockedUntil) {
        return jsonError(recoveryPinLockMessage(failure.lockedUntil), 429);
      }
      return jsonError(
        `Incorrect recovery PIN. ${failure.attemptsRemaining} attempt${failure.attemptsRemaining === 1 ? "" : "s"} remaining.`,
        403
      );
    }

    await resetRecoveryPinAttempts({
      role: account.role,
      accountId: account.accountId,
    });

    const pinVerifiedToken = await createAccountRecoveryPinVerifiedToken({
      role: account.role,
      accountId: account.accountId,
      oldPhone: account.phone,
      uid: account.firebaseUid,
    });

    return jsonSuccess({
      pinVerifiedToken,
      oldPhone: account.phone,
      role: account.role,
    });
  } catch (error) {
    console.error("Account recovery PIN verify error:", error);
    return jsonError("Could not verify recovery PIN. Please try again.", 500);
  }
}
