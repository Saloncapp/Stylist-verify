"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleDigitInput } from "@/lib/digit-input";
import { toast } from "sonner";

const RESEND_COOLDOWN_SEC = 30;

type Step =
  | "confirm-send"
  | "current-otp"
  | "new-phone"
  | "new-otp"
  | "confirm";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPhone: string;
  onComplete: (result: {
    phone: string;
    token?: string;
    role: "salon" | "stylist";
    salon?: unknown;
    stylist?: unknown;
  }) => void;
};

function formatPhone(phone: string) {
  if (phone.length !== 10) return phone;
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
}

/** Mask all but the last 2 digits of a 10-digit Indian mobile. */
function maskPhoneLastTwo(phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return phone;
  return `+91 ********${digits.slice(-2)}`;
}

export function ChangePhoneNumberDialog({
  open,
  onOpenChange,
  currentPhone,
  onComplete,
}: Props) {
  const [step, setStep] = useState<Step>("confirm-send");
  const [currentOtpSession, setCurrentOtpSession] = useState<string | null>(null);
  const [currentVerifiedToken, setCurrentVerifiedToken] = useState<string | null>(
    null
  );
  const [newPhone, setNewPhone] = useState("");
  const [newOtpSession, setNewOtpSession] = useState<string | null>(null);
  const [changeReadyToken, setChangeReadyToken] = useState<string | null>(null);
  const [confirmedNewPhone, setConfirmedNewPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const busy = sending || verifying || confirming;
  const maskedCurrent = maskPhoneLastTwo(currentPhone);

  useEffect(() => {
    if (!open) return;
    resetFlow();
  }, [open]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => {
      setResendIn((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  function resetFlow() {
    setStep("confirm-send");
    setCurrentOtpSession(null);
    setCurrentVerifiedToken(null);
    setNewPhone("");
    setNewOtpSession(null);
    setChangeReadyToken(null);
    setConfirmedNewPhone("");
    setOtp("");
    setSending(false);
    setVerifying(false);
    setConfirming(false);
    setResendIn(0);
    setError(null);
  }

  async function sendCurrentOtp() {
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/account/phone-change/current/send", {
        method: "POST",
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Could not send OTP");
        return;
      }
      setCurrentOtpSession(result.data.otpSession as string);
      setOtp("");
      setResendIn(RESEND_COOLDOWN_SEC);
      setStep("current-otp");
      toast.success("OTP sent to your current number");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  async function verifyCurrentOtp() {
    if (!currentOtpSession) {
      setError("Request an OTP first.");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/account/phone-change/current/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: otp, otpSession: currentOtpSession }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Invalid or expired OTP");
        return;
      }
      setCurrentVerifiedToken(result.data.currentVerifiedToken as string);
      setOtp("");
      setStep("new-phone");
      toast.success("Current number verified");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function sendNewOtp() {
    if (!currentVerifiedToken) {
      setError("Verify your current number first.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(newPhone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (newPhone === currentPhone) {
      setError("New number must be different from your current number.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/account/phone-change/new/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          newPhone,
          currentVerifiedToken,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Could not send OTP");
        return;
      }
      setNewOtpSession(result.data.otpSession as string);
      setOtp("");
      setResendIn(RESEND_COOLDOWN_SEC);
      setStep("new-otp");
      toast.success("OTP sent to your new number");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function verifyNewOtp() {
    if (!currentVerifiedToken || !newOtpSession) {
      setError("Complete the previous steps first.");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/account/phone-change/new/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          newPhone,
          code: otp,
          otpSession: newOtpSession,
          currentVerifiedToken,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Invalid or expired OTP");
        return;
      }
      setChangeReadyToken(result.data.changeReadyToken as string);
      setConfirmedNewPhone(result.data.newPhone as string);
      setOtp("");
      setStep("confirm");
      toast.success("New number verified");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function confirmChange() {
    if (!changeReadyToken) {
      setError("Complete verification first.");
      return;
    }
    setError(null);
    setConfirming(true);
    try {
      const res = await fetch("/api/account/phone-change/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ changeReadyToken }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Failed to update phone number");
        return;
      }
      toast.success("Mobile number updated successfully");
      onComplete({
        phone: result.data.phone as string,
        token: result.data.token as string | undefined,
        role: result.data.role as "salon" | "stylist",
        salon: result.data.salon,
        stylist: result.data.stylist,
      });
      onOpenChange(false);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setConfirming(false);
    }
  }

  const title =
    step === "confirm-send"
      ? "Change phone number"
      : step === "current-otp"
        ? "Verify current number"
        : step === "new-phone"
          ? "Enter new number"
          : step === "new-otp"
            ? "Verify new number"
            : "Confirm change";

  const description =
    step === "confirm-send"
      ? "We'll send a one-time password to your registered mobile number."
      : step === "current-otp"
        ? `Enter the OTP sent to ${maskedCurrent}.`
        : step === "new-phone"
          ? "Enter the mobile number you want to use for login."
          : step === "new-otp"
            ? `Enter the OTP sent to ${formatPhone(newPhone)}.`
            : "Review the numbers below, then confirm to update your account.";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "confirm-send" ? (
            <>
              <div className="space-y-1 text-center text-sm">
                <p className="text-muted-foreground">Registered number</p>
                <p className="text-lg font-semibold tracking-wide text-foreground">
                  {maskedCurrent}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => void sendCurrentOtp()}
                >
                  {sending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Send OTP
                </Button>
              </div>
            </>
          ) : null}

          {step === "current-otp" || step === "new-otp" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone-change-otp">OTP</Label>
                <Input
                  id="phone-change-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otp}
                  disabled={busy}
                  onChange={(e) => {
                    handleDigitInput(e, 6);
                    setOtp(e.target.value);
                    setError(null);
                  }}
                  className="tracking-[0.2em]"
                />
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={busy || otp.length !== 6}
                onClick={() =>
                  void (step === "current-otp"
                    ? verifyCurrentOtp()
                    : verifyNewOtp())
                }
              >
                {(verifying || sending) && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {step === "current-otp"
                  ? "Verify current number"
                  : "Verify new number"}
              </Button>

              <div className="flex min-h-5 items-center justify-center text-sm">
                {resendIn === 0 ? (
                  <button
                    type="button"
                    className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={() =>
                      void (step === "current-otp"
                        ? sendCurrentOtp()
                        : sendNewOtp())
                    }
                  >
                    Resend OTP
                  </button>
                ) : (
                  <p className="text-muted-foreground">
                    Resend OTP in{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {resendIn}s
                    </span>
                  </p>
                )}
              </div>
            </>
          ) : null}

          {step === "new-phone" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone-change-new">New mobile number</Label>
                <Input
                  id="phone-change-new"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={newPhone}
                  disabled={busy}
                  onChange={(e) => {
                    handleDigitInput(e, 10);
                    setNewPhone(e.target.value);
                    setError(null);
                  }}
                />
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={busy || newPhone.length !== 10}
                onClick={() => void sendNewOtp()}
              >
                {sending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Send OTP to new number
              </Button>
            </>
          ) : null}

          {step === "confirm" ? (
            <>
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Current</span>
                  <span className="font-medium">{formatPhone(currentPhone)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">New</span>
                  <span className="font-medium text-primary">
                    {formatPhone(confirmedNewPhone)}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={busy}
                onClick={() => void confirmChange()}
              >
                {confirming && <Loader2 className="mr-2 size-4 animate-spin" />}
                Confirm change
              </Button>
            </>
          ) : null}

          {error ? (
            <p className="text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
