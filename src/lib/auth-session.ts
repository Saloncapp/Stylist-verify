import { SignJWT, jwtVerify } from "jose";

/**
 * Edge-safe session JWT helpers.
 * Middleware must import from this file only — never from `@/lib/auth`
 * (that module loads MongoDB / Node crypto).
 */

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret-change-me"
);

const COOKIE_NAME = "sv_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_COOKIE_MAX_AGE = COOKIE_MAX_AGE;

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
  /** Account authSessionVersion at issue time (defaults to 0). */
  sv?: number;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const body: Record<string, unknown> = {
    uid: payload.uid,
    role: payload.role,
    phone: payload.phone,
    sv: payload.sv ?? 0,
  };
  if (payload.salonId) body.salonId = payload.salonId;
  if (payload.stylistId) body.stylistId = payload.stylistId;

  return new SignJWT(body)
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
    const role =
      payload.role === "salon" || payload.role === "stylist"
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

    const sv =
      typeof payload.sv === "number" &&
      Number.isFinite(payload.sv) &&
      payload.sv >= 0
        ? Math.floor(payload.sv)
        : 0;

    return { uid, role, phone, salonId, stylistId, sv };
  } catch {
    return null;
  }
}

/** Extract Bearer token from an Authorization header value. */
export function extractBearerToken(
  authorizationHeader: string | null | undefined
): string | null {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  const token = match?.[1]?.trim();
  return token || null;
}

export const SETUP_RECOVERY_PIN_PATH = "/setup-recovery-pin";

/** Clears stale web cookie then redirects home (Route Handler). */
export const CLEAR_SESSION_PATH = "/api/auth/clear-session";

export function homePathForRole(role: UserRole): string {
  return role === "salon" ? "/dashboard" : "/stylist";
}
