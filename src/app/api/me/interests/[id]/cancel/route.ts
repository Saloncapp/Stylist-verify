import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStylistSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import { formatInterestRequestCard } from "@/lib/hiring";
import InterestRequest from "@/models/InterestRequest";

/** Stylist cancels/dismisses a pending salon interest request. */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStylistSession();
    if (!session?.stylistId) {
      return jsonError("Not authenticated", 401);
    }

    const { id } = await context.params;
    await connectDB();

    const interest = await InterestRequest.findOne({
      _id: id,
      stylistId: session.stylistId,
    });
    if (!interest) {
      return jsonError("Interest request not found", 404);
    }
    if (interest.status !== "pending") {
      return jsonError("This interest request is no longer pending", 400);
    }

    interest.status = "cancelled";
    await interest.save();

    return jsonSuccess({
      interest: formatInterestRequestCard(interest),
    });
  } catch (error) {
    console.error("Cancel interest error:", error);
    return jsonError("Failed to cancel interest request", 500);
  }
}
