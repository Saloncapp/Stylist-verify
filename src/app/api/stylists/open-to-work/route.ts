import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import {
  buildOpenToWorkTalentFilter,
  encodeHiringCursor,
  formatOpenToWorkTalent,
  OPEN_TO_WORK_STYLIST_SELECT,
  parseHiringLimit,
  decodeHiringCursor,
} from "@/lib/hiring";
import Stylist from "@/models/Stylist";

/** Talent pool: stylists with Open to Work, excluding this salon's Active staff. */
export async function GET(request: NextRequest) {
  try {
    const session = await requireSalonSession();
    if (!session?.salonId) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseHiringLimit(searchParams.get("limit"));
    const cursor = decodeHiringCursor(searchParams.get("cursor"));

    const stylists = await Stylist.find(
      buildOpenToWorkTalentFilter(session.salonId, cursor)
    )
      .select(OPEN_TO_WORK_STYLIST_SELECT)
      .sort({ openToWorkAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const page = stylists.slice(0, limit);
    const items = page.map((s) => formatOpenToWorkTalent(s as never));
    const last = page[page.length - 1];
    const nextCursor =
      stylists.length > limit && last?.openToWorkAt
        ? encodeHiringCursor(new Date(last.openToWorkAt), last._id.toString())
        : stylists.length > limit && last
          ? encodeHiringCursor(new Date(0), last._id.toString())
          : null;

    return jsonSuccess({ items, nextCursor });
  } catch (error) {
    console.error("Open to work list error:", error);
    return jsonError("Failed to load open-to-work stylists", 500);
  }
}
