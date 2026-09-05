import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { verifyRegistrationToken } from "@/lib/registration-token";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { normalizeIndianMobile } from "@/lib/phone";
import { hashAadhaar } from "@/lib/aadhaar-crypto";
import { z } from "zod";
import Stylist from "@/models/Stylist";

const schema = z
  .object({
    idToken: z.string().min(1).optional(),
    registrationToken: z.string().min(1).optional(),
    aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
  })
  .refine((data) => Boolean(data.idToken || data.registrationToken), {
    message: "Registration session is invalid. Please sign in again.",
    path: ["registrationToken"],
  });

/**
 * Pending-registration Aadhaar lookup (requires verified Firebase phone token).
 * Used on the home inline stylist registration step.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    let phone: string | null = null;
    if (parsed.data.registrationToken) {
      const registration = await verifyRegistrationToken(
        parsed.data.registrationToken
      );
      if (!registration) {
        return jsonError("Registration session expired. Please sign in again.", 401);
      }
      phone = registration.phone;
    } else if (parsed.data.idToken) {
      const decoded = await verifyFirebaseIdToken(parsed.data.idToken);
      phone = decoded.phone_number
        ? normalizeIndianMobile(decoded.phone_number)
        : null;
    }
    if (!phone) {
      return jsonError("Phone number was not verified", 400);
    }

    await connectDB();

    const aadhaarHash = hashAadhaar(parsed.data.aadhaarNumber);
    const stylist = await Stylist.findOne({
      $or: [
        { aadhaarHash },
        { aadhaarNumber: parsed.data.aadhaarNumber },
      ],
    });

    if (!stylist) {
      return jsonSuccess({ found: false });
    }

    const mobileMatches =
      normalizeIndianMobile(stylist.mobileNumber) === phone;

    // Only reveal profile details when the verified phone owns this Aadhaar.
    // Otherwise attackers could probe Aadhaars and learn other users' name/mobile.
    if (!mobileMatches) {
      return jsonSuccess({
        found: true,
        mobileMatches: false,
        canLink: false,
        message:
          "A stylist profile with this Aadhaar already exists with a different phone number.",
      });
    }

    return jsonSuccess({
      found: true,
      mobileMatches: true,
      canLink: true,
      name: stylist.name,
      message:
        "A stylist profile already exists for this Aadhaar. Continuing will link it to this phone login.",
    });
  } catch (error) {
    console.error("Stylist aadhaar lookup error:", error);
    return jsonError("Failed to check Aadhaar", 500);
  }
}
