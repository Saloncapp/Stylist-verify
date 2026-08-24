import { connectDB } from "@/lib/db";
import {
  getSession,
  toSalonUser,
  toStylistAccount,
  homePathForRole,
} from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import { maskAadhaar, getAadhaarFromRecord } from "@/lib/aadhaar-crypto";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    if (session.role === "salon" && session.salonId) {
      const salon = await Salon.findById(session.salonId);
      if (!salon) {
        return jsonError("Salon not found", 404);
      }
      return jsonSuccess({
        role: "salon" as const,
        redirectTo: homePathForRole("salon"),
        salon: toSalonUser(salon),
      });
    }

    if (session.role === "stylist" && session.stylistId) {
      const stylist = await Stylist.findById(session.stylistId);
      if (!stylist) {
        return jsonError("Stylist not found", 404);
      }
      let aadhaarMasked: string | undefined;
      try {
        aadhaarMasked = maskAadhaar(getAadhaarFromRecord(stylist));
      } catch {
        aadhaarMasked = undefined;
      }
      return jsonSuccess({
        role: "stylist" as const,
        redirectTo: homePathForRole("stylist"),
        stylist: toStylistAccount({
          ...stylist.toObject(),
          aadhaarMasked,
        }),
      });
    }

    return jsonError("Invalid session", 401);
  } catch (error) {
    console.error("Auth me error:", error);
    return jsonError("Failed to fetch session", 500);
  }
}
