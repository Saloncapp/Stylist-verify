import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }
  return initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

declare global {
  interface Window {
    __svRecaptchaVerifier?: RecaptchaVerifier;
    __svRecaptchaVerifiers?: Record<string, RecaptchaVerifier>;
  }
}

/** Invisible reCAPTCHA used for Firebase phone OTP */
export function getOrCreateRecaptchaVerifier(
  containerId = "recaptcha-container"
): RecaptchaVerifier {
  const auth = getFirebaseAuth();

  if (typeof window !== "undefined") {
    window.__svRecaptchaVerifiers ??= {};
    const existing = window.__svRecaptchaVerifiers[containerId];
    if (existing) return existing;
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
  });

  if (typeof window !== "undefined") {
    window.__svRecaptchaVerifiers ??= {};
    window.__svRecaptchaVerifiers[containerId] = verifier;
    window.__svRecaptchaVerifier = verifier;
  }

  return verifier;
}

export function clearRecaptchaVerifier(containerId?: string) {
  if (typeof window === "undefined") return;

  const clearOne = (id: string, verifier?: RecaptchaVerifier) => {
    try {
      verifier?.clear();
    } catch {
      // ignore
    }
    if (window.__svRecaptchaVerifiers) {
      delete window.__svRecaptchaVerifiers[id];
    }
  };

  if (containerId) {
    const verifier = window.__svRecaptchaVerifiers?.[containerId];
    if (window.__svRecaptchaVerifier === verifier) {
      window.__svRecaptchaVerifier = undefined;
    }
    clearOne(containerId, verifier);
    return;
  }

  if (window.__svRecaptchaVerifiers) {
    for (const [id, verifier] of Object.entries(window.__svRecaptchaVerifiers)) {
      clearOne(id, verifier);
    }
  }
  window.__svRecaptchaVerifier = undefined;
}
