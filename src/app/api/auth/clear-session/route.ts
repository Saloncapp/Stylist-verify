import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  sessionCookieClearOptions,
} from "@/lib/auth-session";

/**
 * Clears the web session cookie and sends the user to sign-in.
 * Server Components / layouts must redirect here instead of calling cookies().set.
 */
export async function GET(request: NextRequest) {
  const url = new URL("/", request.url);
  url.hash = "continue-with-mobile";

  const response = NextResponse.redirect(url);
  response.cookies.set(SESSION_COOKIE_NAME, "", sessionCookieClearOptions());
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );
  return response;
}
