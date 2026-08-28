import { toE164Indian } from "@/lib/phone";

type IdentityToolkitError = {
  error?: {
    message?: string;
    code?: number;
  };
};

function getFirebaseWebApiKey(): string {
  const key =
    process.env.FIREBASE_WEB_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Firebase web API key is not configured. Set FIREBASE_WEB_API_KEY on the server."
    );
  }
  return key;
}

function mapFirebaseAuthError(message: string): string {
  const normalized = message.toUpperCase();
  if (normalized.includes("INVALID_PHONE_NUMBER")) {
    return "Invalid phone number. Use a valid 10-digit Indian mobile.";
  }
  if (normalized.includes("TOO_MANY_ATTEMPTS")) {
    return "Too many attempts. Wait a few minutes and try again.";
  }
  if (normalized.includes("QUOTA_EXCEEDED")) {
    return "SMS quota exceeded. Try again later.";
  }
  if (normalized.includes("CAPTCHA") || normalized.includes("RECAPTCHA")) {
    return "Phone verification is not configured for this environment.";
  }
  if (normalized.includes("SESSION_EXPIRED")) {
    return "OTP session expired. Request a new code.";
  }
  if (normalized.includes("INVALID_CODE") || normalized.includes("INVALID_VERIFICATION")) {
    return "Invalid or expired OTP. Request a new code.";
  }
  return "Phone verification failed. Please try again.";
}

async function callIdentityToolkit<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const apiKey = getFirebaseWebApiKey();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  const payload = (await response.json()) as T & IdentityToolkitError;
  if (!response.ok) {
    const message = payload.error?.message ?? "Firebase phone auth request failed";
    throw new Error(mapFirebaseAuthError(message));
  }

  return payload;
}

export async function sendPhoneVerificationCode(phone: string): Promise<string> {
  const phoneNumber = toE164Indian(phone);
  const disableVerification =
    process.env.FIREBASE_PHONE_AUTH_DISABLE_APP_VERIFICATION === "true";

  const requestBody: Record<string, unknown> = { phoneNumber };
  if (disableVerification) {
    // Required for Firebase Console test phone numbers in server-only flows.
    requestBody.recaptchaToken = "ignored-for-testing";
  }

  const result = await callIdentityToolkit<{ sessionInfo: string }>(
    "accounts:sendVerificationCode",
    requestBody
  );

  if (!result.sessionInfo) {
    throw new Error("Failed to start phone verification.");
  }

  return result.sessionInfo;
}

export async function verifyPhoneVerificationCode(
  sessionInfo: string,
  code: string
): Promise<{ idToken: string; uid: string }> {
  const result = await callIdentityToolkit<{
    idToken: string;
    localId: string;
  }>("accounts:signInWithPhoneNumber", {
    sessionInfo,
    code,
  });

  if (!result.idToken || !result.localId) {
    throw new Error("Invalid or expired OTP. Request a new code.");
  }

  return { idToken: result.idToken, uid: result.localId };
}
