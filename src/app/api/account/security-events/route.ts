import { getSession } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/api";
import { connectDB } from "@/lib/db";
import SecurityEvent from "@/models/SecurityEvent";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const accountId =
      session.role === "salon" ? session.salonId : session.stylistId;
    if (!accountId) {
      return jsonError("Account not found", 404);
    }

    const events = await SecurityEvent.find({
      role: session.role,
      accountId,
      read: false,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return jsonSuccess({
      events: events.map((event) => ({
        id: String(event._id),
        type: event.type,
        message: event.message,
        createdAt: event.createdAt,
      })),
    });
  } catch (error) {
    console.error("Security events error:", error);
    return jsonError("Could not load security notifications.", 500);
  }
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    await connectDB();

    const accountId =
      session.role === "salon" ? session.salonId : session.stylistId;
    if (!accountId) {
      return jsonError("Account not found", 404);
    }

    await SecurityEvent.updateMany(
      { role: session.role, accountId, read: false },
      { $set: { read: true } }
    );

    return jsonSuccess({ ok: true });
  } catch (error) {
    console.error("Mark security events read error:", error);
    return jsonError("Could not update notifications.", 500);
  }
}
