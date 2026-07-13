import { connectDB } from "@/lib/db";
import { getSession, toSalonUser } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import Salon from "@/models/Salon";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const salon = await Salon.findById(session.salonId).select("-password");
    if (!salon) {
      return jsonError("Salon not found", 404);
    }

    return jsonSuccess({ salon: toSalonUser(salon) });
  } catch (error) {
    console.error("Me error:", error);
    return jsonError("Failed to fetch session", 500);
  }
}
