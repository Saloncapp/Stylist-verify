import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { verifySchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import {
  buildPrivateVerifiedStylistFromRecords,
  buildVerifyQuery,
  groupRecordsByAadhaar,
} from "@/lib/verify";
import Stylist from "@/models/Stylist";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

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

    const groups = groupRecordsByAadhaar(records);
    const stylists = groups.map(buildPrivateVerifiedStylistFromRecords);

    return jsonSuccess({
      found: true,
      stylists,
      multiple: stylists.length > 1,
    });
  } catch (error) {
    console.error("Private verify error:", error);
    return jsonError("Verification failed. Please try again.", 500);
  }
}
