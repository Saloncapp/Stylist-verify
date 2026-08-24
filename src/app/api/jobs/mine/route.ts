import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import {
  decodeHiringCursor,
  encodeHiringCursor,
  formatJobCard,
  hiringCursorFilter,
  parseHiringLimit,
} from "@/lib/hiring";
import Job from "@/models/Job";

/** Salon's own job postings. */
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
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {
      salonId: session.salonId,
      ...(status === "open" || status === "closed" ? { status } : {}),
      ...hiringCursorFilter(cursor),
    };

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const page = jobs.slice(0, limit);
    const items = page.map((job) => formatJobCard(job as never));
    const last = page[page.length - 1];
    const nextCursor =
      jobs.length > limit && last
        ? encodeHiringCursor(last.createdAt, last._id.toString())
        : null;

    return jsonSuccess({ items, nextCursor });
  } catch (error) {
    console.error("List my jobs error:", error);
    return jsonError("Failed to load jobs", 500);
  }
}
