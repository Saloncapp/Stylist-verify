import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { createSession, setSessionCookie, toSalonUser } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import Salon from "@/models/Salon";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { email, password } = parsed.data;

    await connectDB();

    const salon = await Salon.findOne({ email });
    if (!salon) {
      return jsonError("Invalid email or password", 401);
    }

    const isValid = await bcrypt.compare(password, salon.password);
    if (!isValid) {
      return jsonError("Invalid email or password", 401);
    }

    const token = await createSession({
      salonId: salon._id.toString(),
      email: salon.email,
    });

    await setSessionCookie(token);

    return jsonSuccess({ salon: toSalonUser(salon) });
  } catch (error) {
    console.error("Login error:", error);
    return jsonError("Login failed. Please try again.", 500);
  }
}
