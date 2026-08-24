import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import { getAadhaarFromRecord, maskAadhaar } from "@/lib/aadhaar-crypto";
import {
  getCurrentSalonEmployment,
  hasActiveEmploymentAtSalon,
} from "@/lib/stylist-employment";
import Application from "@/models/Application";
import Stylist from "@/models/Stylist";

/** Load applicant stylist profile for hire review (skips manual lookup). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    const { id } = await context.params;
    await connectDB();

    const application = await Application.findOne({
      _id: id,
      salonId: session.salonId,
    });
    if (!application) {
      return jsonError("Application not found", 404);
    }

    if (application.status !== "Interested") {
      return jsonError(
        `Cannot hire an application with status ${application.status}`,
        400
      );
    }

    const stylist = await Stylist.findById(application.stylistId);
    if (!stylist) {
      return jsonError("Stylist profile not found", 404);
    }

    const current = getCurrentSalonEmployment(stylist, session.salonId);
    const latest = stylist.employmentHistory.at(-1);
    const plainAadhaar = getAadhaarFromRecord(stylist);

    return jsonSuccess({
      alreadyAtSalon: hasActiveEmploymentAtSalon(stylist, session.salonId),
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
    console.error("Hire profile error:", error);
    return jsonError("Failed to load applicant profile", 500);
  }
}
