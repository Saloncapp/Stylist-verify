import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, homePathForRole } from "@/lib/auth-session";

const SESSION_COOKIE = "sv_session";
/** Unauthenticated users are sent to the home Continue-with-Mobile flow */
const AUTH_ENTRY_PATH = "/";

const guestOnlyExact = new Set(["/"]);

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
  const isSalonProtected = pathname.startsWith("/dashboard");
  const isStylistProtected = pathname.startsWith("/stylist");

  // Legacy /login, /register, /recover → home Continue-with-Mobile flow
  if (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/recover" ||
    pathname.startsWith("/recover/")
  ) {
    if (token) {
      const session = await verifySession(token);
      if (session) {
        return NextResponse.redirect(
          new URL(homePathForRole(session.role), request.url)
        );
      }
      return clearSessionCookie(
        NextResponse.redirect(new URL(AUTH_ENTRY_PATH, request.url))
      );
    }
    const hash = "#continue-with-mobile";
    const target =
      pathname === "/recover" || pathname.startsWith("/recover/")
        ? `${AUTH_ENTRY_PATH}?recover=1${hash}`
        : `${AUTH_ENTRY_PATH}${hash}`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  const isGuestOnly = guestOnlyExact.has(pathname);

  if (!isSalonProtected && !isStylistProtected && !isGuestOnly) {
    return NextResponse.next();
  }

  if (isSalonProtected || isStylistProtected) {
    if (!token) {
      return NextResponse.redirect(new URL(AUTH_ENTRY_PATH, request.url));
    }

    const session = await verifySession(token);
    if (!session) {
      return clearSessionCookie(
        NextResponse.redirect(new URL(AUTH_ENTRY_PATH, request.url))
      );
    }

    if (isSalonProtected && session.role !== "salon") {
      return NextResponse.redirect(
        new URL(homePathForRole(session.role), request.url)
      );
    }

    if (isStylistProtected && session.role !== "stylist") {
      return NextResponse.redirect(
        new URL(homePathForRole(session.role), request.url)
      );
    }

    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.next();
  }

  const session = await verifySession(token);
  if (!session) {
    return clearSessionCookie(NextResponse.next());
  }

  // Authenticated users on home go to their role dashboard
  return NextResponse.redirect(
    new URL(homePathForRole(session.role), request.url)
  );
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/login/:path*",
    "/register",
    "/register/:path*",
    "/recover",
    "/recover/:path*",
    "/dashboard/:path*",
    "/stylist/:path*",
  ],
};
