import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { statusUpdateSchema, createStylistProfileUpdateSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { formatStylist } from "@/lib/formatters";
import { salonSnapshotFromSalon } from "@/lib/salon-sync";
import { getAadhaarFromRecord, hashAadhaar, prepareAadhaarStorage } from "@/lib/aadhaar-crypto";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const { id } = await params;
    await connectDB();

    const stylist = await Stylist.findOne({
      _id: id,
      salonId: session.salonId,
    });

    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    return jsonSuccess({ stylist: formatStylist(stylist) });
  } catch (error) {
    console.error("Get stylist error:", error);
    return jsonError("Failed to fetch stylist", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = statusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { status, remark } = parsed.data;

    await connectDB();

    const salon = await Salon.findById(session.salonId);
    if (!salon) {
      return jsonError("Salon not found", 404);
    }

    const stylist = await Stylist.findOne({
      _id: id,
      salonId: session.salonId,
    });

    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    if (stylist.status === status && status === "Active") {
      return jsonSuccess({ stylist: formatStylist(stylist) });
    }

    const now = new Date();
    stylist.status = status;

    if (status === "Relieved" || status === "Abscond") {
      stylist.leavingDate = now;
    } else if (status === "Active") {
      stylist.leavingDate = undefined;
    }

    stylist.employmentHistory.push({
      status,
      remark,
      salonId: salon._id,
      ...salonSnapshotFromSalon(salon),
      level: stylist.level,
      role: stylist.role,
      employmentType: stylist.employmentType,
      performanceSummary: stylist.performanceSummary ?? "",
      managerFeedback: stylist.managerFeedback ?? "",
      specialistServices: stylist.specialistServices ?? [],
      experienceCertificateUrl: stylist.experienceCertificateUrl ?? "",
      relievingLetterUrl: stylist.relievingLetterUrl ?? "",
      joiningDate: stylist.joiningDate,
      leavingDate:
        status === "Relieved" || status === "Abscond" ? now : undefined,
      updatedAt: now,
    });

    await stylist.save();

    return jsonSuccess({ stylist: formatStylist(stylist) });
  } catch (error) {
    console.error("Update stylist error:", error);
    return jsonError("Failed to update stylist status", 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const stylist = await Stylist.findOne({
      _id: id,
      salonId: session.salonId,
    });

    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    const parsed = createStylistProfileUpdateSchema(stylist.status).safeParse(
      body
    );
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const data = parsed.data;
    const currentAadhaar = getAadhaarFromRecord(stylist);

    if (data.aadhaarNumber !== currentAadhaar) {
      const aadhaarHash = hashAadhaar(data.aadhaarNumber);
      const existingAtSalon = await Stylist.findOne({
        salonId: session.salonId,
        _id: { $ne: stylist._id },
        $or: [{ aadhaarHash }, { aadhaarNumber: data.aadhaarNumber }],
      });
      if (existingAtSalon) {
        return jsonError(
          "This stylist is already registered at your salon",
          409
        );
      }

      const { aadhaarEncrypted } = prepareAadhaarStorage(data.aadhaarNumber);
      stylist.aadhaarHash = aadhaarHash;
      stylist.aadhaarEncrypted = aadhaarEncrypted;
      stylist.aadhaarNumber = undefined;
    }

    stylist.name = data.name;
    stylist.mobileNumber = data.mobileNumber;
    stylist.level = data.level;
    stylist.role = data.role;
    stylist.employmentType = data.employmentType;
    stylist.address = data.address ?? "";
    stylist.photoUrl = data.photoUrl ?? "";

    const statusChanged = stylist.status !== data.status;
    if (statusChanged) {
      const salon = await Salon.findById(session.salonId);
      if (!salon) {
        return jsonError("Salon not found", 404);
      }

      const now = new Date();
      stylist.status = data.status;

      if (data.status === "Relieved" || data.status === "Abscond") {
        stylist.leavingDate = now;
      } else if (data.status === "Active") {
        stylist.leavingDate = undefined;
      }

      stylist.employmentHistory.push({
        status: data.status,
        remark: data.remark,
        salonId: salon._id,
        ...salonSnapshotFromSalon(salon),
        level: stylist.level,
        role: stylist.role,
        employmentType: stylist.employmentType,
        performanceSummary: stylist.performanceSummary ?? "",
        managerFeedback: stylist.managerFeedback ?? "",
        specialistServices: stylist.specialistServices ?? [],
        experienceCertificateUrl: stylist.experienceCertificateUrl ?? "",
        relievingLetterUrl: stylist.relievingLetterUrl ?? "",
        joiningDate: stylist.joiningDate,
        leavingDate:
          data.status === "Relieved" || data.status === "Abscond"
            ? now
            : undefined,
        updatedAt: now,
      });
    }

    await stylist.save();

    return jsonSuccess({ stylist: formatStylist(stylist) });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      return jsonError(
        "This stylist is already registered at your salon",
        409
      );
    }
    console.error("Update stylist profile error:", error);
    return jsonError("Failed to update stylist", 500);
  }
}
