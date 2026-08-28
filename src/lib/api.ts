import { NextResponse } from "next/server";
import type { ZodError } from "zod";

const CORS_HEADERS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Accept, X-Requested-With",
};

export function jsonError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: CORS_HEADERS }
  );
}

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    { success: true, data },
    { status, headers: CORS_HEADERS }
  );
}

export function zodErrorResponse(error: ZodError) {
  const message = error.issues[0]?.message ?? "Validation failed";
  return jsonError(message, 400);
}

/** Handle CORS preflight for API route modules that export OPTIONS. */
export function corsOptionsResponse() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
