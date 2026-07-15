import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  type Auth,
} from "firebase/auth";

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

export const googleProvider = new GoogleAuthProvider();

declare global {
  interface Window {
    __svRecaptchaVerifier?: RecaptchaVerifier;
  }
}

/** Invisible reCAPTCHA used for Firebase phone OTP */
export function getOrCreateRecaptchaVerifier(
  containerId = "recaptcha-container"
): RecaptchaVerifier {
  const auth = getFirebaseAuth();

  if (typeof window !== "undefined" && window.__svRecaptchaVerifier) {
    return window.__svRecaptchaVerifier;
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
  });

  if (typeof window !== "undefined") {
    window.__svRecaptchaVerifier = verifier;
  }

  return verifier;
}

export function clearRecaptchaVerifier() {
  if (typeof window !== "undefined" && window.__svRecaptchaVerifier) {
    try {
      window.__svRecaptchaVerifier.clear();
    } catch {
      // ignore
    }
    window.__svRecaptchaVerifier = undefined;
  }
}
