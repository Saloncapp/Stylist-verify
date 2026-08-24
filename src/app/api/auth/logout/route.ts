import {
  clearSessionCookie,
  SESSION_COOKIE_NAME,
  sessionCookieClearOptions,
} from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  await clearSessionCookie();

  const response = NextResponse.json(
    { success: true, data: { ok: true } },
    { status: 200 }
  );

  // Also clear on the response object so Set-Cookie is always present for the client.
  response.cookies.set(SESSION_COOKIE_NAME, "", sessionCookieClearOptions());
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );

  return response;
}
