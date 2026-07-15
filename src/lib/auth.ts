import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SalonUser } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret-change-me"
);

const COOKIE_NAME = "sv_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  salonId: string;
  email: string;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function toSalonUser(
  salon: {
    _id: { toString(): string };
    salonName: string;
    ownerName: string;
    email: string;
    staffCount: number;
    location: string;
    salonNumber?: string;
    authProvider?: "email" | "google";
  }
): SalonUser {
  return {
    id: salon._id.toString(),
    salonName: salon.salonName,
    ownerName: salon.ownerName,
    email: salon.email,
    staffCount: salon.staffCount,
    location: salon.location,
    salonNumber: salon.salonNumber,
    authProvider: salon.authProvider ?? "email",
  };
}
