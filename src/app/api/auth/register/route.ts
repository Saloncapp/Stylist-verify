import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  createSession,
  setSessionCookie,
  toSalonUser,
  toStylistAccount,
  homePathForRole,
} from "@/lib/auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { verifyRegistrationToken } from "@/lib/registration-token";
import { otpRegisterSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { normalizeIndianMobile } from "@/lib/phone";
import {
  hashAadhaar,
  prepareAadhaarStorage,
  maskAadhaar,
  getAadhaarFromRecord,
} from "@/lib/aadhaar-crypto";
import { nextEmployeeId } from "@/lib/employee-id";
import { DEFAULT_SALON_TYPE } from "@/lib/salon-constants";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

function duplicateKeyMessage(error: unknown): string {
  const err = error as {
    keyPattern?: Record<string, unknown>;
  };
  const fields = err.keyPattern ? Object.keys(err.keyPattern) : [];
  if (fields.includes("email")) {
    return "Could not create the salon account due to an email index conflict. Please try again.";
  }
  if (fields.includes("salonNumber") || fields.includes("mobileNumber")) {
    return "An account with this phone number already exists. Try signing in instead.";
  }
  if (fields.includes("firebaseUid")) {
    return "This phone is already linked to an account. Try signing in instead.";
  }
  if (fields.includes("aadhaarHash") || fields.includes("aadhaarNumber")) {
    return "A stylist profile with this Aadhaar already exists.";
  }
  return "An account with this phone or Aadhaar already exists";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = otpRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const data = parsed.data;
    let decoded: Awaited<ReturnType<typeof verifyFirebaseIdToken>>;
    if (data.registrationToken) {
      const registration = await verifyRegistrationToken(data.registrationToken);
      if (!registration) {
        return jsonError("Registration session expired. Please sign in again.", 401);
      }
      decoded = {
        uid: registration.uid,
        phone_number: `+91${registration.phone}`,
      } as Awaited<ReturnType<typeof verifyFirebaseIdToken>>;
    } else if (data.idToken) {
      decoded = await verifyFirebaseIdToken(data.idToken);
    } else {
      return jsonError("Registration session is invalid. Please sign in again.", 400);
    }
    const phone = decoded.phone_number
      ? normalizeIndianMobile(decoded.phone_number)
      : null;
    if (!phone) {
      return jsonError("Phone number was not verified", 400);
    }

    await connectDB();

    const existingSalon = await Salon.findOne({
      $or: [{ salonNumber: phone }, { firebaseUid: decoded.uid }],
    });
    const existingStylist = await Stylist.findOne({
      $or: [{ mobileNumber: phone }, { firebaseUid: decoded.uid }],
    });

    if (data.role === "salon") {
      if (existingSalon) {
        return jsonError("A salon account already exists for this phone", 409);
      }
      if (existingStylist) {
        return jsonError(
          "This phone is already registered as a stylist account",
          409
        );
      }

      const email = data.email?.trim() || undefined;

      const salon = await Salon.create({
        salonName: data.salonName,
        salonAddress: data.salonAddress,
        salonNumber: phone,
        firebaseUid: decoded.uid,
        ownerName: data.ownerName ?? "",
        ...(email ? { email } : {}),
        ...(data.staffCount != null ? { staffCount: data.staffCount } : {}),
        salonType: data.salonType ?? DEFAULT_SALON_TYPE,
        logoUrl: data.logoUrl ?? "",
      });

      const token = await createSession({
        uid: decoded.uid,
        role: "salon",
        phone,
        salonId: salon._id.toString(),
      });
      await setSessionCookie(token);

      return jsonSuccess(
        {
          role: "salon" as const,
          redirectTo: homePathForRole("salon"),
          token,
          salon: toSalonUser(salon),
        },
        201
      );
    }

    // stylist registration
    if (existingSalon) {
      return jsonError(
        "This phone is already registered as a salon account",
        409
      );
    }

    const aadhaarHash = hashAadhaar(data.aadhaarNumber);
    let stylist = await Stylist.findOne({
      $or: [{ aadhaarHash }, { aadhaarNumber: data.aadhaarNumber }],
    });

    if (stylist) {
      if (stylist.mobileNumber !== phone) {
        return jsonError(
          "A stylist profile with this Aadhaar already exists with a different phone number",
          409
        );
      }
      stylist.firebaseUid = decoded.uid;
      stylist.name = data.name;
      if (data.address !== undefined) stylist.address = data.address;
      if (data.photoUrl !== undefined) stylist.photoUrl = data.photoUrl;
      await stylist.save();
    } else if (existingStylist) {
      if (
        existingStylist.aadhaarHash &&
        existingStylist.aadhaarHash !== aadhaarHash
      ) {
        return jsonError(
          "This phone is already linked to a different stylist profile",
          409
        );
      }
      const { aadhaarEncrypted } = prepareAadhaarStorage(data.aadhaarNumber);
      existingStylist.aadhaarHash = aadhaarHash;
      existingStylist.aadhaarEncrypted = aadhaarEncrypted;
      existingStylist.aadhaarNumber = undefined;
      existingStylist.firebaseUid = decoded.uid;
      existingStylist.name = data.name;
      if (data.address !== undefined) existingStylist.address = data.address;
      if (data.photoUrl !== undefined) existingStylist.photoUrl = data.photoUrl;
      if (!existingStylist.employeeId) {
        existingStylist.employeeId = await nextEmployeeId();
      }
      await existingStylist.save();
      stylist = existingStylist;
    } else {
      const { aadhaarEncrypted } = prepareAadhaarStorage(data.aadhaarNumber);
      const employeeId = await nextEmployeeId();
      stylist = await Stylist.create({
        employeeId,
        name: data.name,
        mobileNumber: phone,
        firebaseUid: decoded.uid,
        aadhaarHash,
        aadhaarEncrypted,
        address: data.address ?? "",
        photoUrl: data.photoUrl ?? "",
        employmentHistory: [],
      });
    }

    let aadhaarMasked: string | undefined;
    try {
      aadhaarMasked = maskAadhaar(getAadhaarFromRecord(stylist));
    } catch {
      aadhaarMasked = maskAadhaar(data.aadhaarNumber);
    }

    const token = await createSession({
      uid: decoded.uid,
      role: "stylist",
      phone,
      stylistId: stylist._id.toString(),
    });
    await setSessionCookie(token);

    return jsonSuccess(
      {
        role: "stylist" as const,
        redirectTo: homePathForRole("stylist"),
        token,
        stylist: toStylistAccount({
          ...stylist.toObject(),
          aadhaarMasked,
        }),
      },
      201
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      console.error("Auth register duplicate key:", error);
      return jsonError(duplicateKeyMessage(error), 409);
    }
    console.error("Auth register error:", error);
    return jsonError("Registration failed. Please try again.", 500);
  }
}
