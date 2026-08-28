import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { verifySchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import {
  buildPublicStylistPreview,
  buildVerifyQuery,
  groupRecordsByAadhaar,
} from "@/lib/verify";
import Stylist from "@/models/Stylist";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const query = buildVerifyQuery(parsed.data);
    if (!query) {
      return jsonError("Enter a valid Aadhaar number or mobile number", 400);
    }

    const records = await Stylist.find(query).sort({ joiningDate: 1 });

    if (records.length === 0) {
      return jsonSuccess({ found: false, stylists: [] });
    }

    const isAadhaarSearch = Boolean(
      parsed.data.aadhaarNumber && /^\d{12}$/.test(parsed.data.aadhaarNumber)
    );
    const groups = isAadhaarSearch
      ? [records]
      : groupRecordsByAadhaar(records);

    // Public verify always returns a privacy-safe preview only.
    // Full details are available via POST /api/verify/private (salon auth).
    return jsonSuccess({
      found: true,
      locked: true,
      count: groups.length,
      multiple: groups.length > 1,
      stylists: [],
      previews: groups.map(buildPublicStylistPreview),
    });
  } catch (error) {
    console.error("Verify error:", error);
    return jsonError("Verification failed. Please try again.", 500);
  }
}
