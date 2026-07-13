import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { verifySchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import {
  buildVerifiedStylistFromRecords,
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

    const { aadhaarNumber, mobileNumber } = parsed.data;

    await connectDB();

    const query: Record<string, string> = {};
    if (aadhaarNumber && /^\d{12}$/.test(aadhaarNumber)) {
      query.aadhaarNumber = aadhaarNumber;
    } else if (mobileNumber && /^[6-9]\d{9}$/.test(mobileNumber)) {
      query.mobileNumber = mobileNumber;
    }

    const records = await Stylist.find(query).sort({ joiningDate: 1 });

    if (records.length === 0) {
      return jsonSuccess({ found: false, stylists: [] });
    }

    // Group by Aadhaar so one person with multiple salon jobs = one result with full history
    const groups = groupRecordsByAadhaar(records);
    const stylists = groups.map(buildVerifiedStylistFromRecords);

    return jsonSuccess({
      found: true,
      stylists,
      multiple: stylists.length > 1,
    });
  } catch (error) {
    console.error("Verify error:", error);
    return jsonError("Verification failed. Please try again.", 500);
  }
}
