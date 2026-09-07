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
import { getAadhaarFromRecord } from "@/lib/aadhaar-crypto";
import {
  applyIdentityFields,
  applySalonEmploymentFields,
  findStylistForSalonQuery,
  getActiveSalonEmployment,
  updateEntrySalonSnapshot,
} from "@/lib/stylist-employment";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const FORMER_EMPLOYER_MESSAGE =
  "Only the stylist's current employer can update this profile. Use Add Stylist or Hire to start a new employment.";

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

    const stylist = await Stylist.findOne(
      findStylistForSalonQuery(id, session.salonId)
    );

    if (!stylist) {
      return jsonError("Stylist not found", 404);
    }

    const active = getActiveSalonEmployment(stylist, session.salonId);
    if (!active) {
      return jsonError(FORMER_EMPLOYER_MESSAGE, 403);
    }

    if (active.status === status && status === "Active") {
      return jsonSuccess({
        stylist: formatStylist(stylist, session.salonId),
      });
    }

    const now = new Date();
    active.status = status;
    active.remark = remark;
    active.updatedAt = now;
    if (status === "Relieved" || status === "Abscond") {
      active.leavingDate = now;
    } else if (status === "Active") {
      active.leavingDate = undefined;
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

    const active = getActiveSalonEmployment(stylist, session.salonId);
    if (!active) {
      return jsonError(FORMER_EMPLOYER_MESSAGE, 403);
    }

    const parsed = createStylistProfileUpdateSchema(active.status).safeParse(
      body
    );
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const data = parsed.data;
    const currentAadhaar = getAadhaarFromRecord(stylist);

    // Login identity is owned by the stylist account — salon cannot rebind it.
    if (data.mobileNumber !== stylist.mobileNumber) {
      return jsonError(
        "Mobile number cannot be changed from the salon dashboard",
        400
      );
    }
    if (data.aadhaarNumber !== currentAadhaar) {
      return jsonError(
        "Aadhaar cannot be changed from the salon dashboard",
        400
      );
    }

    applyIdentityFields(stylist, {
      name: data.name,
      address: data.address,
      photoUrl: data.photoUrl,
      mobileNumber: stylist.mobileNumber,
    });

    const salon = await Salon.findById(session.salonId);
    if (!salon) {
      return jsonError("Salon not found", 404);
    }

    // Status changes on the Active span only (e.g. Relieved). Re-hire uses Add/Hire flows.
    applySalonEmploymentFields(active, data);
    if (
      data.status &&
      data.status !== active.status &&
      (data.status === "Relieved" || data.status === "Abscond")
    ) {
      const now = new Date();
      active.status = data.status;
      active.remark = data.remark;
      active.updatedAt = now;
      active.leavingDate = now;
    }
    updateEntrySalonSnapshot(active, salonSnapshotFromSalon(salon));

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
