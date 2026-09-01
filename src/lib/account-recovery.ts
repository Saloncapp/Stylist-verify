import { connectDB } from "@/lib/db";
import { applyPhoneNumberChange } from "@/lib/phone-change";
import { resetRecoveryPinAttempts } from "@/lib/recovery-pin";
import SecurityEvent from "@/models/SecurityEvent";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

export async function applyAccountRecoveryPhoneChange(params: {
  role: "salon" | "stylist";
  accountId: string;
  oldPhone: string;
  newPhone: string;
  newFirebaseUid?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const applied = await applyPhoneNumberChange({
    role: params.role,
    accountId: params.accountId,
    currentPhone: params.oldPhone,
    newPhone: params.newPhone,
  });
  if (!applied.ok) return applied;

  await connectDB();

  if (params.newFirebaseUid) {
    if (params.role === "salon") {
      await Salon.updateOne(
        { _id: params.accountId },
        { $set: { firebaseUid: params.newFirebaseUid } }
      );
    } else {
      await Stylist.updateOne(
        { _id: params.accountId },
        { $set: { firebaseUid: params.newFirebaseUid } }
      );
    }
  }

  await resetRecoveryPinAttempts({
    role: params.role,
    accountId: params.accountId,
  });

  await SecurityEvent.create({
    role: params.role,
    accountId: params.accountId,
    type: "mobile_number_changed_recovery",
    message: `Your registered mobile number was changed from ${params.oldPhone} to ${params.newPhone} using account recovery.`,
    read: false,
  });

  return { ok: true };
}
