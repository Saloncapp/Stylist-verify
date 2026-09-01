"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { handleDigitInput } from "@/lib/digit-input";
import { normalizeIndianMobile } from "@/lib/phone";
import {
  RECOVER_FLOW_STEPS,
  RECOVER_STEP_LABELS,
  recoverStepDescription,
  recoverStepIndex,
  recoverStepTitle,
  type RecoverAccountStep,
} from "@/lib/recover-account-steps";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const RESEND_COOLDOWN_SEC = 30;

function formatPhone(phone: string) {
  const digits = normalizeIndianMobile(phone) ?? phone.replace(/\D/g, "");
  if (digits.length !== 10) return phone;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function RecoverStepProgress({ step }: { step: RecoverAccountStep }) {
  if (step === "complete") return null;
  const current = recoverStepIndex(step);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step {current + 1} of {RECOVER_FLOW_STEPS.length}
        </p>
        <p className="text-xs font-medium text-primary">
          {RECOVER_STEP_LABELS[step]}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {RECOVER_FLOW_STEPS.map((item, index) => (
          <div
            key={item}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              index <= current ? "bg-primary" : "bg-muted"
            )}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="leading-relaxed">{message}</p>
    </div>
  );
}

export function RecoverAccountFlow() {
  const [step, setStep] = useState<RecoverAccountStep>("verify-identity");
  const [oldPhone, setOldPhone] = useState("");
  const [pin, setPin] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [pinVerifiedToken, setPinVerifiedToken] = useState<string | null>(null);
  const [otpSession, setOtpSession] = useState<string | null>(null);
  const [recoveryReadyToken, setRecoveryReadyToken] = useState<string | null>(
    null
  );
  const [confirmedNewPhone, setConfirmedNewPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => {
      setResendIn((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  function resetNewPhoneStep() {
    setNewPhone("");
    setOtp("");
    setOtpSent(false);
    setOtpSession(null);
    setConfirmedNewPhone("");
    setResendIn(0);
  }

  function goBack() {
    setError(null);
    if (step === "new-phone") {
      setStep("verify-identity");
      setPinVerifiedToken(null);
      resetNewPhoneStep();
      return;
    }
    if (step === "confirm") {
      setStep("new-phone");
      setRecoveryReadyToken(null);
    }
  }

  async function verifyIdentity(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const phone = normalizeIndianMobile(oldPhone);
    if (!phone) {
      setError("Enter your registered 10-digit mobile number.");
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError("Enter your 6-digit recovery PIN.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/account/recover/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Recovery PIN verification failed.");
        setPin("");
        return;
      }
      setPinVerifiedToken(result.data.pinVerifiedToken as string);
      setOldPhone(result.data.oldPhone as string);
      setStep("new-phone");
      toast.success("Identity verified");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendNewPhoneOtp() {
    setError(null);
    if (!pinVerifiedToken) {
      setError("Start account recovery again from the beginning.");
      return;
    }
    const normalized = normalizeIndianMobile(newPhone);
    if (!normalized) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (normalized === normalizeIndianMobile(oldPhone)) {
      setError("New number must be different from your registered number.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/account/recover/new-phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinVerifiedToken, newPhone: normalized }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Could not send OTP.");
        return;
      }
      setOtpSession(result.data.otpSession as string);
      setConfirmedNewPhone(result.data.newPhone as string);
      setOtp("");
      setOtpSent(true);
      setResendIn(RESEND_COOLDOWN_SEC);
      toast.success("OTP sent to your new number");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    if (!pinVerifiedToken || resendIn > 0 || busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/account/recover/new-phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pinVerifiedToken,
          newPhone: confirmedNewPhone || normalizeIndianMobile(newPhone),
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Could not resend OTP.");
        return;
      }
      setOtpSession(result.data.otpSession as string);
      setOtp("");
      setResendIn(RESEND_COOLDOWN_SEC);
      toast.success("OTP resent");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyNewOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pinVerifiedToken || !otpSession) {
      setError("Send OTP to your new number first.");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/account/recover/new-phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pinVerifiedToken,
          newPhone: confirmedNewPhone || normalizeIndianMobile(newPhone),
          code: otp,
          otpSession,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || "OTP verification failed.");
        setOtp("");
        return;
      }
      setRecoveryReadyToken(result.data.recoveryReadyToken as string);
      setConfirmedNewPhone(result.data.newPhone as string);
      setStep("confirm");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmRecovery() {
    setError(null);
    if (!recoveryReadyToken) {
      setError("Complete OTP verification first.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/account/recover/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryReadyToken }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Could not complete recovery.");
        return;
      }
      setStep("complete");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "complete") {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="space-y-4 px-6 py-10 text-center">
          <CheckCircle2
            className="mx-auto size-12 text-emerald-600"
            aria-hidden
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Recovery Complete
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {recoverStepDescription("complete")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Updated from{" "}
              <span className="font-medium text-foreground">
                {formatPhone(oldPhone)}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {formatPhone(confirmedNewPhone)}
              </span>
              . A security notification has been recorded on your account.
            </p>
          </div>
          <Link href="/" className={cn(buttonVariants(), "h-9 w-full px-4")}>
            Sign in with your new number
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>Recover Account</CardTitle>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Use your registered mobile number and recovery PIN to regain access
            when you no longer have your old number.
          </p>
        </div>
        <RecoverStepProgress step={step} />
        <div className="space-y-1 border-t pt-4">
          <h2 className="text-base font-semibold">{recoverStepTitle(step)}</h2>
          <p className="text-sm text-muted-foreground">
            {recoverStepDescription(step)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "verify-identity" && (
          <form className="space-y-4" onSubmit={verifyIdentity}>
            <div className="space-y-2">
              <Label htmlFor="recover-old-phone" className="text-primary font-semibold">
                Registered mobile number
              </Label>
              <Input
                id="recover-old-phone"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit registered number"
                value={oldPhone}
                onChange={(e) => {
                  handleDigitInput(e, 10);
                  setOldPhone(e.target.value);
                  if (error) setError(null);
                }}
                disabled={busy}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recover-pin" className="text-primary font-semibold">
                6-digit recovery PIN
              </Label>
              <Input
                id="recover-pin"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="Enter 6-digit recovery PIN"
                value={pin}
                onChange={(e) => {
                  handleDigitInput(e, 6);
                  setPin(e.target.value);
                  if (error) setError(null);
                }}
                disabled={busy}
              />
            </div>
            {error ? <ErrorBanner message={error} /> : null}
            <div className="flex gap-2">
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "inline-flex h-9 items-center px-3"
                )}
              >
                <ArrowLeft className="mr-2 size-4" />
                Back to sign in
              </Link>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  busy ||
                  oldPhone.replace(/\D/g, "").length !== 10 ||
                  pin.length !== 6
                }
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </form>
        )}

        {step === "new-phone" && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (otpSent) void verifyNewOtp(e);
              else void sendNewPhoneOtp();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="recover-new-phone" className="text-primary font-semibold">
                New mobile number
              </Label>
              <Input
                id="recover-new-phone"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter new 10-digit mobile number"
                value={newPhone}
                onChange={(e) => {
                  handleDigitInput(e, 10);
                  setNewPhone(e.target.value);
                  if (error) setError(null);
                  if (otpSent) {
                    setOtpSent(false);
                    setOtp("");
                    setOtpSession(null);
                  }
                }}
                disabled={busy}
                autoFocus={!otpSent}
              />
            </div>

            {otpSent ? (
              <div className="space-y-2">
                <Label htmlFor="recover-otp" className="text-primary font-semibold">
                  One-time password
                </Label>
                <Input
                  id="recover-otp"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => {
                    handleDigitInput(e, 6);
                    setOtp(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={busy}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit OTP sent to{" "}
                  {formatPhone(confirmedNewPhone || newPhone)}
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0"
                  disabled={busy || resendIn > 0}
                  onClick={() => void resendOtp()}
                >
                  {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
                </Button>
              </div>
            ) : null}

            {error ? <ErrorBanner message={error} /> : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={busy}
              >
                Back
              </Button>
              {otpSent ? (
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={busy || otp.length !== 6}
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={busy || newPhone.replace(/\D/g, "").length !== 10}
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending OTP…
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              )}
            </div>
          </form>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
              <dl className="space-y-3">
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-primary">Registered number</dt>
                  <dd className="font-medium">{formatPhone(oldPhone)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-border/60 pt-3">
                  <dt className="font-medium text-primary">New number</dt>
                  <dd className="font-medium">
                    {formatPhone(confirmedNewPhone)}
                  </dd>
                </div>
              </dl>
            </div>
            {error ? <ErrorBanner message={error} /> : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={busy}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={busy}
                onClick={() => void confirmRecovery()}
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  "Confirm change"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
