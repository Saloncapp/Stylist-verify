import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import Application from "@/models/Application";

/** Count of Interested applications for salon Hiring badge. */
export async function GET() {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const count = await Application.countDocuments({
      salonId: session.salonId,
      status: "Interested",
    });

    return jsonSuccess({ count });
  } catch (error) {
    console.error("Interested count error:", error);
    return jsonError("Failed to load applicant count", 500);
  }
}
