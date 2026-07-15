const EMAIL_PENDING_KEY = "sv_email_pending_auth";

export interface EmailPendingAuth {
  email: string;
  password: string;
}

export function storeEmailPendingAuth(data: EmailPendingAuth) {
  sessionStorage.setItem(EMAIL_PENDING_KEY, JSON.stringify(data));
}

export function getEmailPendingAuth(): EmailPendingAuth | null {
  const raw = sessionStorage.getItem(EMAIL_PENDING_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as EmailPendingAuth;
    if (!parsed.email || !parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearEmailPendingAuth() {
  sessionStorage.removeItem(EMAIL_PENDING_KEY);
}
