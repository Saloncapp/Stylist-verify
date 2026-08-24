import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStylistSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import {
  decodeHiringCursor,
  encodeHiringCursor,
  formatInterestRequestCard,
  hiringCursorFilter,
  parseHiringLimit,
} from "@/lib/hiring";
import InterestRequest from "@/models/InterestRequest";

/** List interest requests for the authenticated stylist. */
export async function GET(request: NextRequest) {
  try {
    const session = await requireStylistSession();
    if (!session?.stylistId) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseHiringLimit(searchParams.get("limit"));
    const cursor = decodeHiringCursor(searchParams.get("cursor"));
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {
      stylistId: session.stylistId,
      ...(status === "pending" ||
      status === "accepted" ||
      status === "cancelled" ||
      status === "withdrawn"
        ? { status }
        : { status: "pending" }),
      ...hiringCursorFilter(cursor),
    };

    const rows = await InterestRequest.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const page = rows.slice(0, limit);
    const items = page.map((row) => formatInterestRequestCard(row as never));
    const last = page[page.length - 1];
    const nextCursor =
      rows.length > limit && last
        ? encodeHiringCursor(last.createdAt, last._id.toString())
        : null;

    return jsonSuccess({ items, nextCursor });
  } catch (error) {
    console.error("List stylist interests error:", error);
    return jsonError("Failed to load interest requests", 500);
  }
}
