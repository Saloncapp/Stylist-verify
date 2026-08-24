"use client";

import { useEffect, useRef, useState } from "react";
import {
  ConfirmationResult,
  signInWithPhoneNumber,
} from "firebase/auth";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleDigitInput } from "@/lib/digit-input";
import {
  getFirebaseAuth,
  getOrCreateRecaptchaVerifier,
  clearRecaptchaVerifier,
} from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DEFAULT_RESEND_COOLDOWN_SEC = 30;

export interface PhoneOtpAuthProps {
  onVerified: (idToken: string, phone: string) => Promise<void> | void;
  /** Label for the final verify step (default: Continue) */
  submitLabel?: string;
  /** Label for sending OTP (default: Continue) */
  continueLabel?: string;
  /** Shown above the mobile input */
  introText?: string;
  /** Shown below Continue before OTP is sent */
  helperText?: string;
  disabled?: boolean;
  /** Unique reCAPTCHA container id when multiple forms exist */
  recaptchaId?: string;
  phoneInputId?: string;
  otpInputId?: string;
  resendCooldownSec?: number;
  /** Comfortable sizing for landing panels; default for compact auth pages */
  density?: "default" | "comfortable";
  /** Primary blue borders for inputs (home Continue with Mobile) */
  accent?: "default" | "primary";
  /** Focus the phone input on mount (home page) */
  autoFocus?: boolean;
}

export function PhoneOtpAuth({
  onVerified,
  submitLabel = "Continue",
  continueLabel = "Continue",
  introText,
  helperText,
  disabled = false,
  recaptchaId = "auth-phone-recaptcha",
  phoneInputId = "auth-phone",
  otpInputId = "auth-otp",
  resendCooldownSec = DEFAULT_RESEND_COOLDOWN_SEC,
  density = "default",
  accent = "default",
  autoFocus = false,
}: PhoneOtpAuthProps) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null
  );
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const comfortable = density === "comfortable";
  const primaryAccent = accent === "primary";
  const controlHeight = comfortable ? "h-11" : "h-9";
  const stackGap = comfortable ? "space-y-5" : "space-y-4";
  const fieldGap = comfortable ? "space-y-2.5" : "space-y-2";
  const phoneGroupClass = primaryAccent
    ? "border-primary/40 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/25"
    : "border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50";
  const phonePrefixClass = primaryAccent
    ? "border-primary/30 bg-primary/5 text-primary"
    : "border-input bg-muted/50 text-muted-foreground";
  const accentInputClass = primaryAccent
    ? "border-primary/40 focus-visible:border-primary focus-visible:ring-primary/25"
    : undefined;

  useEffect(() => {
    return () => clearRecaptchaVerifier(recaptchaId);
  }, [recaptchaId]);

  useEffect(() => {
    if (!autoFocus || otpSent || disabled) return;
    const frame = window.requestAnimationFrame(() => {
      phoneInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [autoFocus, otpSent, disabled]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => {
      setResendIn((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  async function handleSendOtp() {
    if (resendIn > 0) return;
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    try {
      setSending(true);
      clearRecaptchaVerifier(recaptchaId);
      const auth = getFirebaseAuth();
      const verifier = getOrCreateRecaptchaVerifier(recaptchaId);
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        verifier
      );
      setConfirmation(confirmationResult);
      setOtpSent(true);
      setOtp("");
      setResendIn(resendCooldownSec);
      toast.success("OTP sent");
    } catch (error) {
      console.error("Send OTP error:", error);
      clearRecaptchaVerifier(recaptchaId);
      toast.error("Failed to send OTP. Check Firebase phone auth settings.");
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyOtp() {
    if (!confirmation) {
      toast.error("Request an OTP first");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    try {
      setVerifying(true);
      const credential = await confirmation.confirm(otp);
      const idToken = await credential.user.getIdToken();
      clearRecaptchaVerifier(recaptchaId);
      await onVerified(idToken, phone);
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error("Invalid OTP. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  function handleChangeNumber() {
    setOtpSent(false);
    setOtp("");
    setConfirmation(null);
    setResendIn(0);
    clearRecaptchaVerifier(recaptchaId);
  }

  const busy = sending || verifying || disabled;
  const canResend = otpSent && resendIn === 0 && !busy;

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!otpSent) {
      void handleSendOtp();
      return;
    }
    void handleVerifyOtp();
  }

  function handleEnterKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (busy) return;
    if (!otpSent) {
      void handleSendOtp();
      return;
    }
    void handleVerifyOtp();
  }

  return (
    <form className={cn(stackGap, "w-full")} onSubmit={handleFormSubmit}>
      {introText && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {introText}
        </p>
      )}

      <div className={fieldGap}>
        <Label
          htmlFor={phoneInputId}
          className={cn(
            comfortable && "text-sm font-medium",
            primaryAccent && "text-primary"
          )}
        >
          Mobile number
        </Label>
        <div
          className={cn(
            "flex min-w-0 items-stretch overflow-hidden rounded-lg border bg-transparent transition-colors",
            controlHeight,
            phoneGroupClass,
            (busy || otpSent) && "opacity-50"
          )}
        >
          <span
            className={cn(
              "inline-flex shrink-0 items-center border-r px-3 text-sm font-medium",
              phonePrefixClass
            )}
          >
            +91
          </span>
          <Input
            ref={phoneInputRef}
            id={phoneInputId}
            type="text"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            placeholder="10-digit mobile"
            value={phone}
            disabled={busy || otpSent}
            autoFocus={autoFocus && !otpSent}
            onChange={(e) => {
              handleDigitInput(e, 10);
              setPhone(e.target.value);
            }}
            onKeyDown={handleEnterKey}
            className={cn(
              "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:border-0 focus-visible:ring-0",
              comfortable && "px-3 text-base md:text-sm"
            )}
          />
        </div>        {otpSent && (
          <button
            type="button"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50"
            onClick={handleChangeNumber}
            disabled={busy}
          >
            Change Mobile Number
          </button>
        )}
      </div>

      {!otpSent ? (
        <div className={cn(fieldGap, "pt-0.5")}>
          <Button
            type="submit"
            size={comfortable ? "lg" : "default"}
            className={cn("w-full", comfortable && "h-11 text-sm font-medium")}
            disabled={busy || phone.length !== 10}
          >
            {sending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {continueLabel}
          </Button>
          {helperText && (
            <p className="text-center text-xs leading-relaxed text-muted-foreground sm:text-[0.8125rem]">
              {helperText}
            </p>
          )}
        </div>
      ) : (
        <div className={cn(stackGap, "pt-0.5")}>
          <div className={fieldGap}>
            <Label
              htmlFor={otpInputId}
              className={cn(comfortable && "text-sm font-medium")}
            >
              OTP
            </Label>
            <Input
              id={otpInputId}
              type="text"
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
              onKeyDown={handleEnterKey}
              className={cn(
                "tracking-[0.2em]",
                controlHeight,
                comfortable && "px-3 text-center text-base md:text-sm",
                accentInputClass
              )}
            />
            <p className="text-xs text-muted-foreground">
              Code sent to +91 {phone}
            </p>
          </div>

          <Button
            type="submit"
            size={comfortable ? "lg" : "default"}
            className={cn("w-full", comfortable && "h-11 text-sm font-medium")}
            disabled={busy || otp.length !== 6}
          >
            {verifying && <Loader2 className="mr-2 size-4 animate-spin" />}
            {submitLabel}
          </Button>

          <div className="flex min-h-5 items-center justify-center text-sm">
            {canResend ? (
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50"
                onClick={handleSendOtp}
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
        </div>
      )}

      <div id={recaptchaId} />
    </form>
  );
}
