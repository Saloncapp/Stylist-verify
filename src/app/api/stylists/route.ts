import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { stylistCreateSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { hashAadhaar, prepareAadhaarStorage } from "@/lib/aadhaar-crypto";
import { formatStylist } from "@/lib/formatters";
import { nextEmployeeId } from "@/lib/employee-id";
import {
  applyIdentityFields,
  hasActiveEmploymentAtSalon,
  stylistAccessibleBySalonQuery,
} from "@/lib/stylist-employment";
import { buildEmploymentEntry } from "@/lib/stylist-employment-write";
import { salonSnapshotFromSalon } from "@/lib/salon-sync";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

function isDuplicateKeyError(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

function workingFromDate(month?: number, year?: number) {
  if (month == null || year == null) return new Date();
  return new Date(year, month - 1, 1);
}

export async function GET() {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const stylists = await Stylist.find(
      stylistAccessibleBySalonQuery(session.salonId)
    ).sort({ createdAt: -1 });

    const formatted = stylists.map((stylist) =>
      formatStylist(stylist, session.salonId)
    );

    const stats = {
      total: formatted.length,
      active: formatted.filter((s) => s.status === "Active").length,
      relieved: formatted.filter((s) => s.status === "Relieved").length,
      absconded: formatted.filter((s) => s.status === "Abscond").length,
    };

    return jsonSuccess({
      stats,
      stylists: formatted,
    });
  } catch (error) {
    console.error("List stylists error:", error);
    return jsonError("Failed to fetch stylists", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    const body = await request.json();
    const parsed = stylistCreateSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const data = parsed.data;

    await connectDB();

    const salon = await Salon.findById(session.salonId);
    if (!salon) {
      return jsonError("Salon not found", 404);
    }

    const phoneTakenBySalon = await Salon.findOne({
      salonNumber: data.mobileNumber,
    });
    if (phoneTakenBySalon) {
      return jsonError(
        "This phone number belongs to a salon account and cannot be used for a stylist",
        409
      );
    }

    const aadhaarHash = hashAadhaar(data.aadhaarNumber);
    const existing = await Stylist.findOne({
      $or: [{ aadhaarHash }, { aadhaarNumber: data.aadhaarNumber }],
    });

    if (
      !existing &&
      (await Stylist.findOne({ mobileNumber: data.mobileNumber }))
    ) {
      return jsonError(
        "A stylist profile with this phone number already exists",
        409
      );
    }

    if (existing && existing.mobileNumber !== data.mobileNumber) {
      const phoneOwner = await Stylist.findOne({
        mobileNumber: data.mobileNumber,
        _id: { $ne: existing._id },
      });
      if (phoneOwner) {
        return jsonError(
          "This phone number is already linked to another stylist profile",
          409
        );
      }
    }

    const now = new Date();
    const joiningDate = workingFromDate(
      data.workingFromMonth,
      data.workingFromYear
    );
    const snapshot = salonSnapshotFromSalon(salon);

    if (existing) {
      if (hasActiveEmploymentAtSalon(existing, session.salonId)) {
        return jsonError(
          "This stylist is already registered at your salon",
          409
        );
      }

      applyIdentityFields(existing, data);
      if (!existing.employeeId) {
        existing.employeeId = await nextEmployeeId();
      }
      const historyEntry = buildEmploymentEntry({
        salon,
        snapshot,
        data,
        now,
        joiningDate,
        employeeId: existing.employeeId,
      });
      existing.employmentHistory.push(historyEntry);
      existing.markModified("employmentHistory");
      await existing.save();

      return jsonSuccess(
        {
          stylist: formatStylist(existing, session.salonId),
          linked: true,
        },
        200
      );
    }

    const { aadhaarEncrypted } = prepareAadhaarStorage(data.aadhaarNumber);
    const employeeId = await nextEmployeeId();
    const historyEntry = buildEmploymentEntry({
      salon,
      snapshot,
      data,
      now,
      joiningDate,
      employeeId,
    });

    const stylist = await Stylist.create({
      employeeId,
      name: data.name,
      mobileNumber: data.mobileNumber,
      aadhaarHash,
      aadhaarEncrypted,
      address: data.address ?? "",
      photoUrl: data.photoUrl ?? "",
      employmentHistory: [historyEntry],
    });

    return jsonSuccess(
      {
        stylist: formatStylist(stylist, session.salonId),
        linked: false,
      },
      201
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return jsonError(
        "This stylist profile already exists. Try adding them again to link employment.",
        409
      );
    }
    console.error("Create stylist error:", error);
    return jsonError("Failed to add stylist", 500);
  }
}
