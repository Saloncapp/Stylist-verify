import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret-change-me"
);

const PHONE_VERIFICATION_TOKEN_TTL = "30m";

export type SalonStylistPhoneVerificationPayload = {
  kind: "salon_stylist_phone";
  salonId: string;
  phone: string;
  uid: string;
};

export async function createSalonStylistPhoneVerificationToken(
  payload: Omit<SalonStylistPhoneVerificationPayload, "kind">
): Promise<string> {
  return new SignJWT({ kind: "salon_stylist_phone", ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(PHONE_VERIFICATION_TOKEN_TTL)
    .sign(JWT_SECRET);
}

export async function verifySalonStylistPhoneVerificationToken(
  token: string
): Promise<SalonStylistPhoneVerificationPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.kind !== "salon_stylist_phone") return null;

    const salonId = typeof payload.salonId === "string" ? payload.salonId : "";
    const phone = typeof payload.phone === "string" ? payload.phone : "";
    const uid = typeof payload.uid === "string" ? payload.uid : "";

    if (!salonId || !phone || !uid) return null;

    return { kind: "salon_stylist_phone", salonId, phone, uid };
  } catch {
    return null;
  }
}

export async function assertSalonPhoneVerification(params: {
  token: string | undefined;
  salonId: string;
  phone: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!params.token?.trim()) {
    return {
      ok: false,
      message: "Phone number must be verified before adding this stylist.",
    };
  }

  const verified = await verifySalonStylistPhoneVerificationToken(params.token);
  if (!verified) {
    return {
      ok: false,
      message: "Phone verification expired. Verify the number again.",
    };
  }

  if (verified.salonId !== params.salonId) {
    return {
      ok: false,
      message: "Phone verification is not valid for this salon session.",
    };
  }

  if (verified.phone !== params.phone) {
    return {
      ok: false,
      message: "Verified phone number does not match the stylist mobile.",
    };
  }

  return { ok: true };
}
