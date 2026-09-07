import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import {
  statusUpdateSchema,
  createStylistProfileUpdateSchema,
} from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import { formatStylist } from "@/lib/formatters";
import { salonSnapshotFromSalon } from "@/lib/salon-sync";
import {
  getAadhaarFromRecord,
  hashAadhaar,
  prepareAadhaarStorage,
} from "@/lib/aadhaar-crypto";
import {
  applyIdentityFields,
  applySalonEmploymentFields,
  findStylistForSalonQuery,
  getCurrentSalonEmployment,
  updateEntrySalonSnapshot,
} from "@/lib/stylist-employment";
import { buildEmploymentEntry } from "@/lib/stylist-employment-write";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    const { id } = await params;
    await connectDB();

    const stylist = await Stylist.findOne(
      findStylistForSalonQuery(id, session.salonId)
    );

    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    return jsonSuccess({
      stylist: formatStylist(stylist, session.salonId),
    });
  } catch (error) {
    console.error("Get stylist error:", error);
    return jsonError("Failed to fetch stylist", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
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

    const stylist = await Stylist.findOne(
      findStylistForSalonQuery(id, session.salonId)
    );

    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    const current = getCurrentSalonEmployment(stylist, session.salonId);
    if (current?.status === status && status === "Active") {
      return jsonSuccess({
        stylist: formatStylist(stylist, session.salonId),
      });
    }

    const now = new Date();

    if (current && current.status !== "Active" && status === "Active") {
      const historyEntry = buildEmploymentEntry({
        salon,
        data: {
          status,
          remark,
          level: current.level,
          role: current.role,
          employmentType: current.employmentType,
        },
        now,
      });
      stylist.employmentHistory.push(historyEntry);
    } else if (current) {
      current.status = status;
      current.remark = remark;
      current.updatedAt = now;
      if (status === "Relieved" || status === "Abscond") {
        current.leavingDate = now;
      } else if (status === "Active") {
        current.leavingDate = undefined;
      }
    } else {
      const historyEntry = buildEmploymentEntry({
        salon,
        data: { status, remark },
        now,
      });
      stylist.employmentHistory.push(historyEntry);
    }

    stylist.markModified("employmentHistory");
    await stylist.save();

    return jsonSuccess({
      stylist: formatStylist(stylist, session.salonId),
    });
  } catch (error) {
    console.error("Update stylist error:", error);
    return jsonError("Failed to update stylist status", 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const stylist = await Stylist.findOne(
      findStylistForSalonQuery(id, session.salonId)
    );

    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    const current = getCurrentSalonEmployment(stylist, session.salonId);
    const parsed = createStylistProfileUpdateSchema(
      current?.status ?? "Active"
    ).safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const data = parsed.data;
    const currentAadhaar = getAadhaarFromRecord(stylist);

    if (data.aadhaarNumber !== currentAadhaar) {
      const aadhaarHash = hashAadhaar(data.aadhaarNumber);
      const existing = await Stylist.findOne({
        _id: { $ne: stylist._id },
        $or: [{ aadhaarHash }, { aadhaarNumber: data.aadhaarNumber }],
      });
      if (existing) {
        return jsonError(
          "A stylist profile with this Aadhaar already exists",
          409
        );
      }

      const { aadhaarEncrypted } = prepareAadhaarStorage(data.aadhaarNumber);
      stylist.aadhaarHash = aadhaarHash;
      stylist.aadhaarEncrypted = aadhaarEncrypted;
      stylist.aadhaarNumber = undefined;
    }

    applyIdentityFields(stylist, data);

    const salon = await Salon.findById(session.salonId);
    if (!salon) {
      return jsonError("Salon not found", 404);
    }

    if (current && current.status !== "Active" && data.status === "Active") {
      const historyEntry = buildEmploymentEntry({
        salon,
        data,
      });
      applySalonEmploymentFields(historyEntry, data);
      stylist.employmentHistory.push(historyEntry);
    } else if (current) {
      applySalonEmploymentFields(current, data);
      const statusChanged = current.status !== data.status;
      if (statusChanged && data.status) {
        const now = new Date();
        current.status = data.status;
        current.remark = data.remark;
        current.updatedAt = now;
        if (data.status === "Relieved" || data.status === "Abscond") {
          current.leavingDate = now;
        } else if (data.status === "Active") {
          current.leavingDate = undefined;
        }
      }
      updateEntrySalonSnapshot(current, salonSnapshotFromSalon(salon));
    } else {
      const historyEntry = buildEmploymentEntry({ salon, data });
      stylist.employmentHistory.push(historyEntry);
    }

    stylist.markModified("employmentHistory");
    await stylist.save();

    return jsonSuccess({
      stylist: formatStylist(stylist, session.salonId),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      return jsonError(
        "A stylist profile with this Aadhaar already exists",
        409
      );
    }
    console.error("Update stylist profile error:", error);
    return jsonError("Failed to update stylist", 500);
  }
}
