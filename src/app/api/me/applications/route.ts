import { connectDB } from "@/lib/db";
import { requireStylistSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import {
  decodeHiringCursor,
  encodeHiringCursor,
  formatApplicationCard,
  hiringCursorFilter,
  parseHiringLimit,
} from "@/lib/hiring";
import Application from "@/models/Application";
import { NextRequest } from "next/server";

/** List the authenticated stylist's own applications. */
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
      ...(status === "Interested" ||
      status === "Rejected" ||
      status === "Hired"
        ? { status }
        : {}),
      ...hiringCursorFilter(cursor),
    };

    const apps = await Application.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const page = apps.slice(0, limit);
    const items = page.map((app) => formatApplicationCard(app as never));
    const last = page[page.length - 1];
    const nextCursor =
      apps.length > limit && last
        ? encodeHiringCursor(last.createdAt, last._id.toString())
        : null;

    return jsonSuccess({ items, nextCursor });
  } catch (error) {
    console.error("List stylist applications error:", error);
    return jsonError("Failed to load applications", 500);
  }
}
