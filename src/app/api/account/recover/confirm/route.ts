import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { verifyAccountRecoveryReadyToken } from "@/lib/account-recovery-token";
import { applyAccountRecoveryPhoneChange } from "@/lib/account-recovery";
import { connectDB } from "@/lib/db";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";
import { normalizeIndianMobile } from "@/lib/phone";

const schema = z.object({
  recoveryReadyToken: z.string().min(1, "Complete OTP verification first"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const ready = await verifyAccountRecoveryReadyToken(
      parsed.data.recoveryReadyToken
    );
    if (!ready) {
      return jsonError(
        "Recovery verification expired. Start account recovery again.",
        403
      );
    }

    await connectDB();

    if (ready.role === "salon") {
      const salon = await Salon.findById(ready.accountId);
      if (!salon) {
        return jsonError("Account not found.", 404);
      }
      const currentPhone = normalizeIndianMobile(salon.salonNumber);
      if (currentPhone !== ready.oldPhone) {
        return jsonError(
          "Your registered phone number has changed. Start recovery again.",
          403
        );
      }
    } else {
      const stylist = await Stylist.findById(ready.accountId);
      if (!stylist) {
        return jsonError("Account not found.", 404);
      }
      const currentPhone = normalizeIndianMobile(stylist.mobileNumber);
      if (currentPhone !== ready.oldPhone) {
        return jsonError(
          "Your registered phone number has changed. Start recovery again.",
          403
        );
      }
    }

    const applied = await applyAccountRecoveryPhoneChange({
      role: ready.role,
      accountId: ready.accountId,
      oldPhone: ready.oldPhone,
      newPhone: ready.newPhone,
      newFirebaseUid: ready.newFirebaseUid,
    });

    if (!applied.ok) {
      return jsonError(
        applied.message,
        applied.message.includes("already") ? 409 : 400
      );
    }

    return jsonSuccess({
      role: ready.role,
      oldPhone: ready.oldPhone,
      newPhone: ready.newPhone,
      message:
        "Your mobile number has been updated. Sign in with your new number.",
    });
  } catch (error) {
    console.error("Account recovery confirm error:", error);
    return jsonError("Could not complete account recovery. Please try again.", 500);
  }
}
