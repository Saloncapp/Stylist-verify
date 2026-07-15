import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { passwordUpdateSchema } from "@/lib/validations";
import { jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api";
import Salon from "@/models/Salon";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const body = await request.json();
    const parsed = passwordUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { currentPassword, newPassword } = parsed.data;

    await connectDB();

    const salon = await Salon.findById(session.salonId);
    if (!salon) {
      return jsonError("Salon not found", 404);
    }

    if (salon.authProvider === "google") {
      return jsonError("Password cannot be changed for Google-connected accounts", 400);
    }

    if (!salon.password) {
      return jsonError("Password is not set for this account", 400);
    }

    const isValid = await bcrypt.compare(currentPassword, salon.password);
    if (!isValid) {
      return jsonError("Current password is incorrect", 401);
    }

    salon.password = await bcrypt.hash(newPassword, 12);
    await salon.save();

    return jsonSuccess({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    return jsonError("Failed to update password", 500);
  }
}
