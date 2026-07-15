import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import Salon from "@/models/Salon";
import { z } from "zod";

const checkEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = checkEmailSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const existing = await Salon.findOne({
      email: parsed.data.email.toLowerCase(),
    }).select("_id");

    if (existing) {
      return jsonError("An account with this email already exists", 409);
    }

    return jsonSuccess({ available: true });
  } catch (error) {
    console.error("Check email error:", error);
    return jsonError("Failed to check email availability", 500);
  }
}
