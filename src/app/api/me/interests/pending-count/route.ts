import { connectDB } from "@/lib/db";
import { requireStylistSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import InterestRequest from "@/models/InterestRequest";

/** Pending salon interest request count for stylist nav badge. */
export async function GET() {
  try {
    const session = await requireStylistSession();
    if (!session?.stylistId) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const count = await InterestRequest.countDocuments({
      stylistId: session.stylistId,
      status: "pending",
    });

    return jsonSuccess({ count });
  } catch (error) {
    console.error("Pending interest count error:", error);
    return jsonError("Failed to load interest count", 500);
  }
}
