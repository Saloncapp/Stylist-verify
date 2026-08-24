import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { normalizeIndianMobile } from "@/lib/phone";
import { hashAadhaar } from "@/lib/aadhaar-crypto";
import { z } from "zod";
import Stylist from "@/models/Stylist";

const schema = z.object({
  idToken: z.string().min(1),
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
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

    const decoded = await verifyFirebaseIdToken(parsed.data.idToken);
    const phone = decoded.phone_number
      ? normalizeIndianMobile(decoded.phone_number)
      : null;
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

    const mobileMatches = stylist.mobileNumber === phone;

    return jsonSuccess({
      found: true,
      mobileMatches,
      name: stylist.name,
      mobileNumber: stylist.mobileNumber,
      employeeId: stylist.employeeId ?? "",
      canLink: mobileMatches,
      message: mobileMatches
        ? "A stylist profile already exists for this Aadhaar. Continuing will link it to this phone login."
        : "A stylist profile with this Aadhaar already exists with a different phone number.",
    });
  } catch (error) {
    console.error("Stylist aadhaar lookup error:", error);
    return jsonError("Failed to check Aadhaar", 500);
  }
}
