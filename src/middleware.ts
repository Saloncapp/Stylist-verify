import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

const SESSION_COOKIE = "sv_session";
const DASHBOARD_PATH = "/dashboard";
const LOGIN_PATH = "/login";

/** Public routes that logged-in users should not see. */
const guestOnlyExact = new Set(["/", "/login", "/register"]);

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isProtected = pathname.startsWith(DASHBOARD_PATH);
  const isGuestOnly = guestOnlyExact.has(pathname);

  if (!isProtected && !isGuestOnly) {
    return NextResponse.next();
  }

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }

    const session = await verifySession(token);
    if (!session) {
      return clearSessionCookie(
        NextResponse.redirect(new URL(LOGIN_PATH, request.url))
      );
    }

    return NextResponse.next();
  }

  // Guest-only: landing, login, register
  if (!token) {
    return NextResponse.next();
  }

  const session = await verifySession(token);
  if (!session) {
    return clearSessionCookie(NextResponse.next());
  }

  return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
}

export const config = {
  matcher: ["/", "/login", "/register", "/dashboard/:path*"],
};
