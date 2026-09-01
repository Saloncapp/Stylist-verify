"use client";

import { useEffect, useId, useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { handleDigitInput } from "@/lib/digit-input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const RESEND_COOLDOWN_SEC = 30;

export type PhoneVerificationState = {
  verifiedPhone: string | null;
  phoneVerificationToken: string | null;
};

type SalonStylistPhoneFieldProps = {
  phone: string;
  onPhoneChange: (phone: string) => void;
  verification: PhoneVerificationState;
  onVerificationChange: (state: PhoneVerificationState) => void;
  disabled?: boolean;
  inputId?: string;
  label?: string;
  description?: string;
  className?: string;
};

function isValidIndianMobile(phone: string) {
  return /^[6-9]\d{9}$/.test(phone);
}

export function isPhoneVerifiedFor(
  phone: string,
  verification: PhoneVerificationState
) {
  const digits = phone.replace(/\D/g, "").slice(0, 10);
  return (
    Boolean(verification.phoneVerificationToken) &&
    verification.verifiedPhone === digits
  );
}

export function SalonStylistPhoneField({
  phone,
  onPhoneChange,
  verification,
  onVerificationChange,
  disabled = false,
  inputId,
  label = "Mobile Number",
  description,
  className,
}: SalonStylistPhoneFieldProps) {
  const reactId = useId();
  const fieldId = inputId ?? `salon-stylist-phone-${reactId}`;
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpSession, setOtpSession] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const digits = phone.replace(/\D/g, "").slice(0, 10);
  const verified = isPhoneVerifiedFor(digits, verification);
  const canVerify = isValidIndianMobile(digits) && !disabled && !verified;
  const busy = sending || verifying;

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => {
      setResendIn((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  function resetOtpModal() {
    setOtp("");
    setOtpSession(null);
    setResendIn(0);
    setSending(false);
    setVerifying(false);
  }

  function handlePhoneInput(e: React.ChangeEvent<HTMLInputElement>) {
    handleDigitInput(e, 10);
    const next = e.target.value.replace(/\D/g, "").slice(0, 10);
    onPhoneChange(next);
    if (verification.verifiedPhone && verification.verifiedPhone !== next) {
      onVerificationChange({
        verifiedPhone: null,
        phoneVerificationToken: null,
      });
    }
  }

  async function sendOtp() {
    if (resendIn > 0 || !isValidIndianMobile(digits)) return;
    setSending(true);
    try {
      const res = await fetch("/api/salon/stylist-phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits }),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Failed to send OTP");
        return;
      }
      setOtpSession(result.data.otpSession as string);
      setOtp("");
      setResendIn(RESEND_COOLDOWN_SEC);
      toast.success("OTP sent");
    } catch {
      toast.error("Failed to send OTP. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function verifyOtp() {
    if (!otpSession) {
      toast.error("Request an OTP first");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      toast.error("Enter the 6-digit OTP");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch("/api/salon/stylist-phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: digits,
          code: otp,
          otpSession,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Invalid or expired OTP");
        return;
      }

      onVerificationChange({
        verifiedPhone: result.data.phone as string,
        phoneVerificationToken: result.data.phoneVerificationToken as string,
      });
      onPhoneChange(result.data.phone as string);
      setOtpOpen(false);
      resetOtpModal();
      toast.success("Mobile number verified");
    } catch {
      toast.error("OTP verification failed. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  function openVerifyModal() {
    if (!canVerify) return;
    resetOtpModal();
    setOtpOpen(true);
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={fieldId}>{label}</Label>
        {verified && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <BadgeCheck className="size-3.5" aria-hidden />
            Verified
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          id={fieldId}
          inputMode="numeric"
          maxLength={10}
          placeholder="10-digit mobile"
          value={digits}
          disabled={disabled}
          onChange={handlePhoneInput}
          className={cn(verified && "border-success/40 bg-success/5")}
        />
        <Button
          type="button"
          variant={verified ? "outline" : "default"}
          className="shrink-0"
          disabled={!canVerify && !verified}
          onClick={openVerifyModal}
        >
          {verified ? "Verified" : "Verify Number"}
        </Button>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {!verified && isValidIndianMobile(digits) && (
        <p className="text-xs font-medium text-warning" role="status">
          New stylists must verify this mobile number before they can be added.
        </p>
      )}

      <Dialog
        open={otpOpen}
        onOpenChange={(open) => {
          setOtpOpen(open);
          if (!open) resetOtpModal();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify mobile number</DialogTitle>
            <DialogDescription>
              We&apos;ll send a one-time password to +91 {digits}. The stylist
              must confirm they own this number before you can add them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Sending OTP to </span>
              <span className="font-medium">+91 {digits}</span>
            </div>

            {!otpSession ? (
              <Button
                type="button"
                className="w-full"
                disabled={busy || !isValidIndianMobile(digits)}
                onClick={() => void sendOtp()}
              >
                {sending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Send OTP
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor={`${fieldId}-otp`}>Enter OTP</Label>
                  <Input
                    id={`${fieldId}-otp`}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={otp}
                    disabled={busy}
                    onChange={(e) => {
                      handleDigitInput(e, 6);
                      setOtp(e.target.value);
                    }}
                    className="tracking-[0.2em]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Code sent to +91 {digits}
                  </p>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={busy || otp.length !== 6}
                  onClick={() => void verifyOtp()}
                >
                  {verifying && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Confirm verification
                </Button>

                <div className="flex min-h-5 items-center justify-center text-sm">
                  {resendIn === 0 ? (
                    <button
                      type="button"
                      className="font-medium text-primary underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => void sendOtp()}
                      disabled={busy}
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
