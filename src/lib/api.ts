import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function zodErrorResponse(error: ZodError) {
  const message = error.issues[0]?.message ?? "Validation failed";
  return jsonError(message, 400);
}
