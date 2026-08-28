import { connectDB } from "@/lib/db";
import {
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

export async function resolvePhoneAuthSession(
  uid: string,
  phone: string
): Promise<PhoneAuthSessionResult> {
  await connectDB();

  const salon = await Salon.findOne({ salonNumber: phone });
  if (salon) {
    salon.firebaseUid = uid;
    await salon.save();

    const token = await createSession({
      uid,
      role: "salon",
      phone,
      salonId: salon._id.toString(),
    });
    await setSessionCookie(token);

    return {
      role: "salon",
      redirectTo: homePathForRole("salon"),
      token,
      salon: toSalonUser(salon),
    };
  }

  const stylist = await Stylist.findOne({ mobileNumber: phone });
  if (stylist) {
    stylist.firebaseUid = uid;
    await stylist.save();

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
