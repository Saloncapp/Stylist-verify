import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret-change-me"
);

const REGISTRATION_TOKEN_TTL = "30m";

export type RegistrationTokenPayload = {
  uid: string;
  phone: string;
};

export async function createRegistrationToken(
  payload: RegistrationTokenPayload
): Promise<string> {
  return new SignJWT({ kind: "registration", ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REGISTRATION_TOKEN_TTL)
    .sign(JWT_SECRET);
}

export async function verifyRegistrationToken(
  token: string
): Promise<RegistrationTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.kind !== "registration") return null;
    const uid = typeof payload.uid === "string" ? payload.uid : "";
    const phone = typeof payload.phone === "string" ? payload.phone : "";
    if (!uid || !phone) return null;
    return { uid, phone };
  } catch {
    return null;
  }
}
