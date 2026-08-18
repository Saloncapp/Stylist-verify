import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { verifySchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import {
  buildPublicStylistPreview,
  buildVerifiedStylistFromRecords,
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
    const session = await getSession();

    // Logged-out users get a privacy-safe preview only — no contact, salon, or document data
    if (!session) {
      return jsonSuccess({
        found: true,
        locked: true,
        count: groups.length,
        multiple: groups.length > 1,
        stylists: [],
        previews: groups.map(buildPublicStylistPreview),
      });
    }

    const stylists = groups.map(buildVerifiedStylistFromRecords);

    return jsonSuccess({
      found: true,
      locked: false,
      stylists,
      multiple: stylists.length > 1,
    });
  } catch (error) {
    console.error("Verify error:", error);
    return jsonError("Verification failed. Please try again.", 500);
  }
}
