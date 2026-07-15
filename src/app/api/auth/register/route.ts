import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import Salon from "@/models/Salon";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const {
      salonName,
      ownerName,
      email,
      password,
      staffCount,
      location,
      salonNumber,
    } = parsed.data;

    await connectDB();

    const existing = await Salon.findOne({ email });
    if (existing) {
      return jsonError("An account with this email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const salon = await Salon.create({
      salonName,
      ownerName,
      email,
      password: hashedPassword,
      authProvider: "email",
      staffCount,
      location,
      salonNumber,
    });

    const token = await createSession({
      salonId: salon._id.toString(),
      email: salon.email,
    });

    await setSessionCookie(token);

    return jsonSuccess(
      {
        salon: {
          id: salon._id.toString(),
          salonName: salon.salonName,
          ownerName: salon.ownerName,
          email: salon.email,
          staffCount: salon.staffCount,
          location: salon.location,
          salonNumber: salon.salonNumber,
          authProvider: salon.authProvider,
        },
      },
      201
    );
  } catch (error) {
    console.error("Register error:", error);
    return jsonError("Registration failed. Please try again.", 500);
  }
}
