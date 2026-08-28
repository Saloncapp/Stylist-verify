import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  extractBearerToken,
  SESSION_COOKIE_NAME,
  sessionCookieClearOptions,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Clear cookie session (web). Mobile uses Bearer JWT in SecureStore and clears locally.
  await clearSessionCookie();

  const response = NextResponse.json(
    { success: true, data: { ok: true } },
    { status: 200 }
  );

  // Always emit Set-Cookie on the response (covers Route Handler + mobile clients).
  response.cookies.set(SESSION_COOKIE_NAME, "", sessionCookieClearOptions());

  // Explicit no-store so proxies/clients do not cache an authenticated logout response.
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );

  // Acknowledge Bearer logout requests from the mobile app (stateless JWT — client clears token).
  const bearer = extractBearerToken(request.headers.get("authorization"));
  if (bearer) {
    response.headers.set("X-SV-Logout", "ok");
  }

  return response;
}
