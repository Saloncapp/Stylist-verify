import { connectDB } from "@/lib/db";
import type { SessionPayload } from "@/lib/auth";
import { normalizeIndianMobile } from "@/lib/phone";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

export type AccountPhoneContext = {
  role: "salon" | "stylist";
  accountId: string;
  currentPhone: string;
  uid: string;
};

export async function resolveAccountPhoneContext(
  session: SessionPayload
): Promise<AccountPhoneContext | null> {
  await connectDB();

  if (session.role === "salon" && session.salonId) {
    const salon = await Salon.findById(session.salonId);
    if (!salon?.salonNumber) return null;
    const currentPhone = normalizeIndianMobile(salon.salonNumber);
    if (!currentPhone) return null;
    return {
      role: "salon",
      accountId: session.salonId,
      currentPhone,
      uid: session.uid,
    };
  }

  if (session.role === "stylist" && session.stylistId) {
    const stylist = await Stylist.findById(session.stylistId);
    if (!stylist?.mobileNumber) return null;
    const currentPhone = normalizeIndianMobile(stylist.mobileNumber);
    if (!currentPhone) return null;
    return {
      role: "stylist",
      accountId: session.stylistId,
      currentPhone,
      uid: session.uid,
    };
  }

  return null;
}

export async function assertNewPhoneAvailable(params: {
  role: "salon" | "stylist";
  accountId: string;
  newPhone: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const newPhone = normalizeIndianMobile(params.newPhone);
  if (!newPhone) {
    return { ok: false, message: "Enter a valid 10-digit mobile number." };
  }

  await connectDB();

  const salonConflict = await Salon.findOne({ salonNumber: newPhone });
  if (
    salonConflict &&
    String(salonConflict._id) !== params.accountId &&
    params.role === "salon"
  ) {
    return {
      ok: false,
      message: "This number is already registered to another salon account.",
    };
  }
  if (salonConflict && params.role === "stylist") {
    return {
      ok: false,
      message: "This number is already registered to a salon account.",
    };
  }

  const stylistConflict = await Stylist.findOne({ mobileNumber: newPhone });
  if (
    stylistConflict &&
    String(stylistConflict._id) !== params.accountId &&
    params.role === "stylist"
  ) {
    return {
      ok: false,
      message: "This number is already registered to another stylist profile.",
    };
  }
  if (stylistConflict && params.role === "salon") {
    return {
      ok: false,
      message: "This number is already registered to a stylist profile.",
    };
  }

  return { ok: true };
}

export async function applyPhoneNumberChange(params: {
  role: "salon" | "stylist";
  accountId: string;
  newPhone: string;
  currentPhone: string;
}): Promise<
  | { ok: true; authSessionVersion: number }
  | { ok: false; message: string }
> {
  const newPhone = normalizeIndianMobile(params.newPhone);
  const currentPhone = normalizeIndianMobile(params.currentPhone);
  if (!newPhone || !currentPhone) {
    return { ok: false, message: "Invalid phone number." };
  }
  if (newPhone === currentPhone) {
    return {
      ok: false,
      message: "New number must be different from your current number.",
    };
  }

  const availability = await assertNewPhoneAvailable({
    role: params.role,
    accountId: params.accountId,
    newPhone,
  });
  if (!availability.ok) return availability;

  await connectDB();

  if (params.role === "salon") {
    const salon = await Salon.findById(params.accountId);
    if (!salon) {
      return { ok: false, message: "Salon account not found." };
    }
    if (normalizeIndianMobile(salon.salonNumber) !== currentPhone) {
      return {
        ok: false,
        message: "Your registered phone number has changed. Start again.",
      };
    }
    const nextVersion = (salon.authSessionVersion ?? 0) + 1;
    salon.salonNumber = newPhone;
    salon.authSessionVersion = nextVersion;
    await salon.save();
    return { ok: true, authSessionVersion: nextVersion };
  }

  const stylist = await Stylist.findById(params.accountId);
  if (!stylist) {
    return { ok: false, message: "Stylist account not found." };
  }
  if (normalizeIndianMobile(stylist.mobileNumber) !== currentPhone) {
    return {
      ok: false,
      message: "Your registered phone number has changed. Start again.",
    };
  }
  const nextVersion = (stylist.authSessionVersion ?? 0) + 1;
  stylist.mobileNumber = newPhone;
  stylist.authSessionVersion = nextVersion;
  await stylist.save();
  return { ok: true, authSessionVersion: nextVersion };
}
