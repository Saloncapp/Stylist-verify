"use client";

/**
 * Clears app session + Firebase client auth, then hard-navigates to home.
 * Uses location.replace so Back does not return to a protected route.
 */
export async function logoutToHome(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    // still leave the protected area
  }

  try {
    const { getFirebaseAuth } = await import("@/lib/firebase");
    const { signOut } = await import("firebase/auth");
    await signOut(getFirebaseAuth());
  } catch {
    // ignore
  }

  try {
    sessionStorage.removeItem("sv_otp_pending");
  } catch {
    // ignore
  }

  window.location.replace("/");
}
