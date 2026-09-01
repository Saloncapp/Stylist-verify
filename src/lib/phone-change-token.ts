import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/lib/auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret-change-me"
);

const CURRENT_VERIFIED_TTL = "15m";
const CHANGE_READY_TTL = "15m";

export type PhoneChangeCurrentVerifiedPayload = {
  kind: "phone_change_current";
  role: UserRole;
  accountId: string;
  currentPhone: string;
  uid: string;
};

export type PhoneChangeReadyPayload = {
  kind: "phone_change_ready";
  role: UserRole;
  accountId: string;
  currentPhone: string;
  newPhone: string;
  /** Session/account Firebase uid (matches logged-in user) */
  uid: string;
  /** Firebase uid from new-number OTP — used to update the account on confirm */
  newFirebaseUid?: string;
};

export async function createPhoneChangeCurrentVerifiedToken(
  payload: Omit<PhoneChangeCurrentVerifiedPayload, "kind">
): Promise<string> {
  return new SignJWT({ kind: "phone_change_current", ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(CURRENT_VERIFIED_TTL)
    .sign(JWT_SECRET);
}

export async function verifyPhoneChangeCurrentVerifiedToken(
  token: string
): Promise<PhoneChangeCurrentVerifiedPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.kind !== "phone_change_current") return null;
    const role =
      payload.role === "salon" || payload.role === "stylist"
        ? payload.role
        : null;
    const accountId =
      typeof payload.accountId === "string" ? payload.accountId : "";
    const currentPhone =
      typeof payload.currentPhone === "string" ? payload.currentPhone : "";
    const uid = typeof payload.uid === "string" ? payload.uid : "";
    if (!role || !accountId || !currentPhone || !uid) return null;
    return { kind: "phone_change_current", role, accountId, currentPhone, uid };
  } catch {
    return null;
  }
}

export async function createPhoneChangeReadyToken(
  payload: Omit<PhoneChangeReadyPayload, "kind">
): Promise<string> {
  return new SignJWT({ kind: "phone_change_ready", ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(CHANGE_READY_TTL)
    .sign(JWT_SECRET);
}

export async function verifyPhoneChangeReadyToken(
  token: string
): Promise<PhoneChangeReadyPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.kind !== "phone_change_ready") return null;
    const role =
      payload.role === "salon" || payload.role === "stylist"
        ? payload.role
        : null;
    const accountId =
      typeof payload.accountId === "string" ? payload.accountId : "";
    const currentPhone =
      typeof payload.currentPhone === "string" ? payload.currentPhone : "";
    const newPhone =
      typeof payload.newPhone === "string" ? payload.newPhone : "";
    const uid = typeof payload.uid === "string" ? payload.uid : "";
    const newFirebaseUid =
      typeof payload.newFirebaseUid === "string" && payload.newFirebaseUid
        ? payload.newFirebaseUid
        : undefined;
    if (!role || !accountId || !currentPhone || !newPhone || !uid) return null;
    if (currentPhone === newPhone) return null;
    return {
      kind: "phone_change_ready",
      role,
      accountId,
      currentPhone,
      newPhone,
      uid,
      newFirebaseUid,
    };
  } catch {
    return null;
  }
}
