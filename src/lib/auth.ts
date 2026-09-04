import { cookies, headers } from "next/headers";
import { connectDB } from "@/lib/db";
import { normalizeIndianMobile } from "@/lib/phone";
import type { SalonType } from "@/lib/salon-constants";
import { DEFAULT_SALON_TYPE } from "@/lib/salon-constants";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";
import type { SalonUser, StylistAccount } from "@/types";
import {
  SESSION_COOKIE_MAX_AGE,
  SESSION_COOKIE_NAME,
  createSession,
  extractBearerToken,
  homePathForRole,
  sessionCookieClearOptions,
  SETUP_RECOVERY_PIN_PATH,
  CLEAR_SESSION_PATH,
  verifySession,
  type SessionPayload,
  type UserRole,
} from "@/lib/auth-session";

export {
  SESSION_COOKIE_NAME,
  createSession,
  extractBearerToken,
  homePathForRole,
  sessionCookieClearOptions,
  SETUP_RECOVERY_PIN_PATH,
  CLEAR_SESSION_PATH,
  verifySession,
  type SessionPayload,
  type UserRole,
};

/**
 * Sessions embed login phone + authSessionVersion.
 * After recovery / phone change, older JWTs no longer match and are rejected
 * (website cookie cleared; app Bearer gets 401 → local logout).
 */
export function accountAuthSessionVersion(
  value: number | null | undefined
): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

export async function sessionMatchesAccount(
  session: SessionPayload
): Promise<boolean> {
  const sessionPhone = normalizeIndianMobile(session.phone);
  if (!sessionPhone) return false;
  const sessionVersion = accountAuthSessionVersion(session.sv);

  await connectDB();

  if (session.role === "salon" && session.salonId) {
    const salon = await Salon.findById(session.salonId).select(
      "salonNumber authSessionVersion"
    );
    if (!salon) return false;
    if (normalizeIndianMobile(salon.salonNumber) !== sessionPhone) return false;
    return (
      accountAuthSessionVersion(salon.authSessionVersion) === sessionVersion
    );
  }

  if (session.role === "stylist" && session.stylistId) {
    const stylist = await Stylist.findById(session.stylistId).select(
      "mobileNumber authSessionVersion"
    );
    if (!stylist) return false;
    if (normalizeIndianMobile(stylist.mobileNumber) !== sessionPhone) {
      return false;
    }
    return (
      accountAuthSessionVersion(stylist.authSessionVersion) === sessionVersion
    );
  }

  return false;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", sessionCookieClearOptions());
}

/**
 * Resolve session from Authorization Bearer (mobile) or sv_session cookie (web).
 * Bearer takes precedence when both are present.
 * Rejects tokens whose phone no longer matches the account (e.g. after recovery).
 */
export async function getSession(): Promise<SessionPayload | null> {
  const headerStore = await headers();
  const bearer = extractBearerToken(headerStore.get("authorization"));
  if (bearer) {
    const fromBearer = await verifySession(bearer);
    if (fromBearer) {
      if (await sessionMatchesAccount(fromBearer)) return fromBearer;
      // Stale bearer after phone change/recovery — do not fall back to cookie.
      return null;
    }
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieToken) return null;

  const fromCookie = await verifySession(cookieToken);
  if (!fromCookie) return null;

  if (!(await sessionMatchesAccount(fromCookie))) {
    // Do not cookies().set here — Server Components cannot mutate cookies.
    // Callers should redirect to /api/auth/clear-session to clear + sign out.
    return null;
  }

  return fromCookie;
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
