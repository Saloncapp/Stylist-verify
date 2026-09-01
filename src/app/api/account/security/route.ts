import { getSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import { resolveAccountPhoneContext } from "@/lib/phone-change";
import { getRecoveryPinStatus } from "@/lib/recovery-pin";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const account = await resolveAccountPhoneContext(session);
    if (!account) {
      return jsonError("Account not found", 404);
    }

    const pinStatus = await getRecoveryPinStatus(
      account.role,
      account.accountId
    );

    return jsonSuccess({
      role: account.role,
      currentPhone: account.currentPhone,
      hasRecoveryPin: pinStatus.hasRecoveryPin,
    });
  } catch (error) {
    console.error("Account security status error:", error);
    return jsonError("Could not load account security settings.", 500);
  }
}
