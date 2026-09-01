import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/lib/auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret-change-me"
);

const PIN_VERIFIED_TTL = "20m";
const RECOVERY_READY_TTL = "20m";

export type AccountRecoveryPinVerifiedPayload = {
  kind: "account_recovery_pin";
  role: UserRole;
  accountId: string;
  oldPhone: string;
  uid?: string;
};

export type AccountRecoveryReadyPayload = {
  kind: "account_recovery_ready";
  role: UserRole;
  accountId: string;
  oldPhone: string;
  newPhone: string;
  newFirebaseUid?: string;
  uid?: string;
};

export async function createAccountRecoveryPinVerifiedToken(
  payload: Omit<AccountRecoveryPinVerifiedPayload, "kind">
): Promise<string> {
  return new SignJWT({ kind: "account_recovery_pin", ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(PIN_VERIFIED_TTL)
    .sign(JWT_SECRET);
}

export async function verifyAccountRecoveryPinVerifiedToken(
  token: string
): Promise<AccountRecoveryPinVerifiedPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.kind !== "account_recovery_pin") return null;
    const role =
      payload.role === "salon" || payload.role === "stylist"
        ? payload.role
        : null;
    const accountId =
      typeof payload.accountId === "string" ? payload.accountId : "";
    const oldPhone =
      typeof payload.oldPhone === "string" ? payload.oldPhone : "";
    const uid =
      typeof payload.uid === "string" && payload.uid ? payload.uid : undefined;
    if (!role || !accountId || !oldPhone) return null;
    return { kind: "account_recovery_pin", role, accountId, oldPhone, uid };
  } catch {
    return null;
  }
}

export async function createAccountRecoveryReadyToken(
  payload: Omit<AccountRecoveryReadyPayload, "kind">
): Promise<string> {
  return new SignJWT({ kind: "account_recovery_ready", ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(RECOVERY_READY_TTL)
    .sign(JWT_SECRET);
}

export async function verifyAccountRecoveryReadyToken(
  token: string
): Promise<AccountRecoveryReadyPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.kind !== "account_recovery_ready") return null;
    const role =
      payload.role === "salon" || payload.role === "stylist"
        ? payload.role
        : null;
    const accountId =
      typeof payload.accountId === "string" ? payload.accountId : "";
    const oldPhone =
      typeof payload.oldPhone === "string" ? payload.oldPhone : "";
    const newPhone =
      typeof payload.newPhone === "string" ? payload.newPhone : "";
    const newFirebaseUid =
      typeof payload.newFirebaseUid === "string" && payload.newFirebaseUid
        ? payload.newFirebaseUid
        : undefined;
    const uid =
      typeof payload.uid === "string" && payload.uid ? payload.uid : undefined;
    if (!role || !accountId || !oldPhone || !newPhone) return null;
    if (oldPhone === newPhone) return null;
    return {
      kind: "account_recovery_ready",
      role,
      accountId,
      oldPhone,
      newPhone,
      newFirebaseUid,
      uid,
    };
  } catch {
    return null;
  }
}
