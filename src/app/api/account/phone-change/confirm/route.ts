import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createSession,
  getSession,
  setSessionCookie,
  toSalonUser,
  toStylistAccount,
} from "@/lib/auth";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { verifyPhoneChangeReadyToken } from "@/lib/phone-change-token";
import {
  applyPhoneNumberChange,
  resolveAccountPhoneContext,
} from "@/lib/phone-change";
import { getAadhaarFromRecord, maskAadhaar } from "@/lib/aadhaar-crypto";
import { connectDB } from "@/lib/db";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

const schema = z.object({
  changeReadyToken: z.string().min(1, "Complete phone verification first"),
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

    const ready = await verifyPhoneChangeReadyToken(parsed.data.changeReadyToken);
    if (!ready) {
      return jsonError(
        "Phone change verification expired. Start the process again.",
        403
      );
    }
    if (
      ready.role !== account.role ||
      ready.accountId !== account.accountId ||
      ready.currentPhone !== account.currentPhone ||
      ready.uid !== account.uid
    ) {
      return jsonError("Phone change verification is not valid.", 403);
    }

    const applied = await applyPhoneNumberChange({
      role: ready.role,
      accountId: ready.accountId,
      currentPhone: ready.currentPhone,
      newPhone: ready.newPhone,
    });
    if (!applied.ok) {
      return jsonError(applied.message, applied.message.includes("already") ? 409 : 400);
    }

    await connectDB();

    const sessionUid = ready.newFirebaseUid ?? ready.uid;

    if (ready.role === "salon") {
      await Salon.updateOne(
        { _id: ready.accountId },
        { $set: { firebaseUid: sessionUid } }
      );
    } else {
      await Stylist.updateOne(
        { _id: ready.accountId },
        { $set: { firebaseUid: sessionUid } }
      );
    }

    const token = await createSession({
      uid: sessionUid,
      role: ready.role,
      phone: ready.newPhone,
      salonId: ready.role === "salon" ? ready.accountId : undefined,
      stylistId: ready.role === "stylist" ? ready.accountId : undefined,
      sv: applied.authSessionVersion,
    });
    await setSessionCookie(token);

    if (ready.role === "salon") {
      const salon = await Salon.findById(ready.accountId);
      if (!salon) {
        return jsonError("Salon account not found", 404);
      }
      return jsonSuccess({
        role: "salon" as const,
        token,
        phone: ready.newPhone,
        previousPhone: ready.currentPhone,
        salon: toSalonUser(salon),
      });
    }

    const stylist = await Stylist.findById(ready.accountId);
    if (!stylist) {
      return jsonError("Stylist account not found", 404);
    }

    let aadhaarMasked: string | undefined;
    try {
      aadhaarMasked = maskAadhaar(getAadhaarFromRecord(stylist));
    } catch {
      aadhaarMasked = undefined;
    }

    return jsonSuccess({
      role: "stylist" as const,
      token,
      phone: ready.newPhone,
      previousPhone: ready.currentPhone,
      stylist: toStylistAccount({
        ...stylist.toObject(),
        aadhaarMasked,
      }),
    });
  } catch (error) {
    console.error("Phone change confirm error:", error);
    return jsonError("Failed to update phone number. Please try again.", 500);
  }
}
