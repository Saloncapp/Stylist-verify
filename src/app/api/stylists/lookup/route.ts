import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import { getAadhaarFromRecord, hashAadhaar, maskAadhaar } from "@/lib/aadhaar-crypto";
import { normalizeIndianMobile } from "@/lib/phone";
import {
  getCurrentSalonEmployment,
  hasActiveEmploymentAtSalon,
} from "@/lib/stylist-employment";
import Stylist from "@/models/Stylist";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    const aadhaarRaw =
      request.nextUrl.searchParams.get("aadhaar")?.trim() ?? "";
    const mobileRaw =
      request.nextUrl.searchParams.get("mobile")?.trim() ?? "";

    const aadhaarNumber = /^\d{12}$/.test(aadhaarRaw) ? aadhaarRaw : "";
    const mobileNumber = mobileRaw ? normalizeIndianMobile(mobileRaw) : null;

    if (!aadhaarNumber && !mobileNumber) {
      return jsonError("Enter a valid Aadhaar or mobile number", 400);
    }
    if (aadhaarRaw && !aadhaarNumber) {
      return jsonError("Enter a valid 12-digit Aadhaar number", 400);
    }
    if (mobileRaw && !mobileNumber) {
      return jsonError("Enter a valid 10-digit mobile number", 400);
    }

    await connectDB();

    const stylist = aadhaarNumber
      ? await Stylist.findOne({
          $or: [
            { aadhaarHash: hashAadhaar(aadhaarNumber) },
            { aadhaarNumber },
          ],
        })
      : await Stylist.findOne({ mobileNumber: mobileNumber! });

    if (!stylist) {
      return jsonSuccess({
        found: false,
        query: {
          aadhaarNumber: aadhaarNumber || "",
          mobileNumber: mobileNumber || "",
        },
      });
    }

    const current = getCurrentSalonEmployment(stylist, session.salonId);
    const latest = stylist.employmentHistory.at(-1);
    const plainAadhaar = getAadhaarFromRecord(stylist);

    return jsonSuccess({
      found: true,
      alreadyAtSalon: hasActiveEmploymentAtSalon(stylist, session.salonId),
      query: {
        aadhaarNumber: aadhaarNumber || "",
        mobileNumber: mobileNumber || "",
      },
      stylist: {
        id: String(stylist._id),
        employeeId: stylist.employeeId ?? "",
        name: stylist.name,
        mobileNumber: stylist.mobileNumber,
        aadhaarNumber: plainAadhaar,
        aadhaarMasked: maskAadhaar(plainAadhaar),
        address: stylist.address ?? "",
        photoUrl: stylist.photoUrl ?? "",
        level: current?.level ?? latest?.level,
        role: current?.role ?? latest?.role,
        employmentType: current?.employmentType ?? latest?.employmentType,
        status: current?.status ?? latest?.status,
      },
    });
  } catch (error) {
    console.error("Lookup stylist error:", error);
    return jsonError("Failed to look up stylist", 500);
  }
}
