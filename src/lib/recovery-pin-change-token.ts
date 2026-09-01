import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/lib/auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret-change-me"
);

const CURRENT_VERIFIED_TTL = "15m";

export type RecoveryPinCurrentVerifiedPayload = {
  kind: "recovery_pin_current_verified";
  role: UserRole;
  accountId: string;
};

export async function createRecoveryPinCurrentVerifiedToken(
  payload: Omit<RecoveryPinCurrentVerifiedPayload, "kind">
): Promise<string> {
  return new SignJWT({ kind: "recovery_pin_current_verified", ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(CURRENT_VERIFIED_TTL)
    .sign(JWT_SECRET);
}

export async function verifyRecoveryPinCurrentVerifiedToken(
  token: string
): Promise<RecoveryPinCurrentVerifiedPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.kind !== "recovery_pin_current_verified") return null;
    const role =
      payload.role === "salon" || payload.role === "stylist"
        ? payload.role
        : null;
    const accountId =
      typeof payload.accountId === "string" ? payload.accountId : "";
    if (!role || !accountId) return null;
    return { kind: "recovery_pin_current_verified", role, accountId };
  } catch {
    return null;
  }
}
