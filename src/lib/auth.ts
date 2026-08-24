import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SalonType } from "@/lib/salon-constants";
import { DEFAULT_SALON_TYPE } from "@/lib/salon-constants";
import type { SalonUser, StylistAccount } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret-change-me"
);

const COOKIE_NAME = "sv_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const SESSION_COOKIE_NAME = COOKIE_NAME;

export function sessionCookieClearOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
}

export type UserRole = "salon" | "stylist";

export interface SessionPayload {
  uid: string;
  role: UserRole;
  phone: string;
  salonId?: string;
  stylistId?: string;
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
    const uid = typeof payload.uid === "string" ? payload.uid : "";
    const role = payload.role === "salon" || payload.role === "stylist"
      ? payload.role
      : null;
    const phone = typeof payload.phone === "string" ? payload.phone : "";
    if (!uid || !role || !phone) return null;

    const salonId =
      typeof payload.salonId === "string" ? payload.salonId : undefined;
    const stylistId =
      typeof payload.stylistId === "string" ? payload.stylistId : undefined;

    if (role === "salon" && !salonId) return null;
    if (role === "stylist" && !stylistId) return null;

    return { uid, role, phone, salonId, stylistId };
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
  cookieStore.set(COOKIE_NAME, "", sessionCookieClearOptions());
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSalonSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session || session.role !== "salon" || !session.salonId) return null;
  return session;
}

export async function requireStylistSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session || session.role !== "stylist" || !session.stylistId) return null;
  return session;
}

export function homePathForRole(role: UserRole): string {
  return role === "salon" ? "/dashboard" : "/stylist";
}

export function toSalonUser(
  salon: {
    _id: { toString(): string };
    salonName: string;
    ownerName?: string;
    email?: string;
    staffCount?: number;
    salonNumber?: string;
    salonAddress?: string;
    logoUrl?: string;
    salonType?: SalonType;
    googleMapsLocation?: string;
    websiteUrl?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    whatsappNumber?: string;
    youtubeUrl?: string;
    establishmentYear?: number;
  }
): SalonUser {
  return {
    id: salon._id.toString(),
    salonName: salon.salonName,
    ownerName: salon.ownerName ?? "",
    email: salon.email ?? "",
    staffCount: salon.staffCount ?? 1,
    salonNumber: salon.salonNumber ?? "",
    salonAddress: salon.salonAddress ?? "",
    logoUrl: salon.logoUrl || undefined,
    salonType: salon.salonType ?? DEFAULT_SALON_TYPE,
    googleMapsLocation: salon.googleMapsLocation || undefined,
    websiteUrl: salon.websiteUrl || undefined,
    instagramUrl: salon.instagramUrl || undefined,
    facebookUrl: salon.facebookUrl || undefined,
    whatsappNumber: salon.whatsappNumber || undefined,
    youtubeUrl: salon.youtubeUrl || undefined,
    establishmentYear: salon.establishmentYear || undefined,
  };
}

export function toStylistAccount(
  stylist: {
    _id: { toString(): string };
    employeeId?: string;
    name: string;
    mobileNumber: string;
    address?: string;
    photoUrl?: string;
    aadhaarMasked?: string;
    openToWork?: boolean;
    openToWorkAt?: Date | string;
  }
): StylistAccount {
  return {
    id: stylist._id.toString(),
    employeeId: stylist.employeeId,
    name: stylist.name,
    mobileNumber: stylist.mobileNumber,
    address: stylist.address ?? "",
    photoUrl: stylist.photoUrl ?? "",
    aadhaarMasked: stylist.aadhaarMasked,
    openToWork: Boolean(stylist.openToWork),
    openToWorkAt: stylist.openToWorkAt
      ? new Date(stylist.openToWorkAt).toISOString()
      : undefined,
  };
}
