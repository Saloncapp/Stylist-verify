import { connectDB } from "@/lib/db";
import {
  accountAuthSessionVersion,
  createSession,
  setSessionCookie,
  toSalonUser,
  toStylistAccount,
  homePathForRole,
} from "@/lib/auth";
import { createRegistrationToken } from "@/lib/registration-token";
import { maskAadhaar, getAadhaarFromRecord } from "@/lib/aadhaar-crypto";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

export type PhoneAuthSessionResult =
  | {
      role: "salon";
      redirectTo: string;
      token: string;
      salon: ReturnType<typeof toSalonUser>;
    }
  | {
      role: "stylist";
      redirectTo: string;
      token: string;
      stylist: ReturnType<typeof toStylistAccount>;
    }
  | {
      needsRegistration: true;
      phone: string;
      registrationToken: string;
    };

async function ensureFirebaseUid(
  kind: "salon" | "stylist",
  id: string,
  currentUid: string | null | undefined,
  nextUid: string
): Promise<void> {
  if (currentUid === nextUid) return;
  if (kind === "salon") {
    await Salon.updateOne({ _id: id }, { $set: { firebaseUid: nextUid } });
    return;
  }
  await Stylist.updateOne({ _id: id }, { $set: { firebaseUid: nextUid } });
}

export async function resolvePhoneAuthSession(
  uid: string,
  phone: string
): Promise<PhoneAuthSessionResult> {
  await connectDB();

  const [salon, stylist] = await Promise.all([
    Salon.findOne({ salonNumber: phone }),
    Stylist.findOne({ mobileNumber: phone }),
  ]);

  if (salon) {
    await ensureFirebaseUid(
      "salon",
      salon._id.toString(),
      salon.firebaseUid,
      uid
    );
    salon.firebaseUid = uid;

    const token = await createSession({
      uid,
      role: "salon",
      phone,
      salonId: salon._id.toString(),
      sv: accountAuthSessionVersion(salon.authSessionVersion),
    });
    await setSessionCookie(token);

    return {
      role: "salon",
      redirectTo: homePathForRole("salon"),
      token,
      salon: toSalonUser(salon),
    };
  }

  if (stylist) {
    await ensureFirebaseUid(
      "stylist",
      stylist._id.toString(),
      stylist.firebaseUid,
      uid
    );
    stylist.firebaseUid = uid;

    let aadhaarMasked: string | undefined;
    try {
      aadhaarMasked = maskAadhaar(getAadhaarFromRecord(stylist));
    } catch {
      aadhaarMasked = undefined;
    }

    const token = await createSession({
      uid,
      role: "stylist",
      phone,
      stylistId: stylist._id.toString(),
      sv: accountAuthSessionVersion(stylist.authSessionVersion),
    });
    await setSessionCookie(token);

    return {
      role: "stylist",
      redirectTo: homePathForRole("stylist"),
      token,
      stylist: toStylistAccount({
        ...stylist.toObject(),
        aadhaarMasked,
      }),
    };
  }

  const registrationToken = await createRegistrationToken({ uid, phone });
  return {
    needsRegistration: true,
    phone,
    registrationToken,
  };
}
