"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "change";
  onComplete: () => void;
};

type Step = "current" | "new" | "confirm";

function stepTitle(mode: "create" | "change", step: Step): string {
  if (mode === "create") {
    return step === "new" ? "Create Recovery PIN" : "Confirm Recovery PIN";
  }
  if (step === "current") return "Enter Current PIN";
  if (step === "new") return "Enter New PIN";
  return "Confirm New PIN";
}

function stepDescription(mode: "create" | "change", step: Step): string {
  if (mode === "create") {
    return step === "new"
      ? "Choose a 6-digit PIN for account recovery when you lose access to your registered mobile number."
      : "Re-enter your recovery PIN to confirm.";
  }
  if (step === "current") {
    return "Enter your current 6-digit recovery PIN to continue.";
  }
  if (step === "new") {
    return "Choose a new 6-digit recovery PIN.";
  }
  return "Re-enter your new recovery PIN to confirm.";
}

export function RecoveryPinDialog({
  open,
  onOpenChange,
  mode,
  onComplete,
}: Props) {
  const [step, setStep] = useState<Step>(mode === "change" ? "current" : "new");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [currentPinVerifiedToken, setCurrentPinVerifiedToken] = useState<
    string | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingCurrent, setVerifyingCurrent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(mode === "change" ? "current" : "new");
    setPin("");
    setConfirmPin("");
    setCurrentPin("");
    setCurrentPinVerifiedToken(null);
    setError(null);
    setSubmitting(false);
    setVerifyingCurrent(false);
  }, [open, mode]);

  function goBack() {
    setError(null);
    if (step === "confirm") {
      setConfirmPin("");
      setStep("new");
      return;
    }
    if (step === "new" && mode === "change") {
      setPin("");
      setCurrentPinVerifiedToken(null);
      setStep("current");
    }
  }

  async function verifyCurrentPin() {
    setError(null);
    if (!/^\d{6}$/.test(currentPin)) {
      setError("Enter your current 6-digit recovery PIN.");
      return;
    }

    setVerifyingCurrent(true);
    try {
      const res = await fetch("/api/account/recovery-pin/verify-current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPin }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Current recovery PIN is incorrect.");
        setCurrentPin("");
        return;
      }
      setCurrentPinVerifiedToken(result.data.currentPinVerifiedToken as string);
      setStep("new");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setVerifyingCurrent(false);
    }
  }

  function handleContinue() {
    setError(null);
    if (step === "current") {
      void verifyCurrentPin();
      return;
    }
    if (step === "new") {
      if (!/^\d{6}$/.test(pin)) {
        setError("Recovery PIN must be exactly 6 digits.");
        return;
      }
      setStep("confirm");
      return;
    }
    void handleSubmit();
  }

  async function handleSubmit() {
    setError(null);

    if (!/^\d{6}$/.test(pin)) {
      setError("Recovery PIN must be exactly 6 digits.");
      setStep("new");
      return;
    }
    if (pin !== confirmPin) {
      setError("PIN and confirmation do not match.");
      return;
    }
    if (mode === "change" && !currentPinVerifiedToken) {
      setError("Verify your current recovery PIN again.");
      setStep("current");
      setCurrentPin("");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/account/recovery-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          mode === "change"
            ? {
                action: "change",
                pin,
                confirmPin,
                currentPinVerifiedToken,
              }
            : {
                action: "create",
                pin,
                confirmPin,
              }
        ),
      });
      const result = await res.json();
      if (!result.success) {
        const message = result.message || "Could not save recovery PIN.";
        if (
          mode === "change" &&
          message.toLowerCase().includes("current pin verification")
        ) {
          setStep("current");
          setCurrentPin("");
          setPin("");
          setConfirmPin("");
          setCurrentPinVerifiedToken(null);
        }
        setError(message);
        return;
      }
      toast.success(
        mode === "create"
          ? "Recovery PIN created successfully"
          : "Recovery PIN updated successfully"
      );
      onComplete();
      onOpenChange(false);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const showBack =
    (step === "new" && mode === "change") || step === "confirm";

  const activeValue =
    step === "current" ? currentPin : step === "new" ? pin : confirmPin;

  const setActiveValue = (value: string) => {
    if (step === "current") setCurrentPin(value);
    else if (step === "new") setPin(value);
    else setConfirmPin(value);
  };

  const inputId =
    step === "current"
      ? "recovery-current-pin"
      : step === "new"
        ? "recovery-new-pin"
        : "recovery-confirm-pin";

  const inputLabel =
    step === "current"
      ? "Current recovery PIN"
      : step === "new"
        ? mode === "create"
          ? "Recovery PIN"
          : "New recovery PIN"
        : "Confirm recovery PIN";

  const busy = submitting || verifyingCurrent;

  const continueLabel =
    step === "confirm"
      ? mode === "create"
        ? "Create PIN"
        : "Update PIN"
      : step === "current"
        ? "Verify PIN"
        : "Continue";

  const steps: Step[] =
    mode === "change" ? ["current", "new", "confirm"] : ["new", "confirm"];
  const stepIndex = steps.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{stepTitle(mode, step)}</DialogTitle>
          <DialogDescription>{stepDescription(mode, step)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {steps.map((item, index) => (
              <div
                key={item}
                className={`h-1.5 flex-1 rounded-full ${
                  index <= stepIndex ? "bg-primary" : "bg-muted"
                }`}
                aria-hidden
              />
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor={inputId}>{inputLabel}</Label>
            <Input
              id={inputId}
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={activeValue}
              onChange={(e) => {
                handleDigitInput(e, 6);
                setActiveValue(e.target.value);
                if (error) setError(null);
              }}
              disabled={busy}
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-between gap-2">
            <div>
              {showBack ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goBack}
                  disabled={busy}
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={busy || activeValue.length !== 6}
                onClick={handleContinue}
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {verifyingCurrent ? "Verifying…" : "Saving…"}
                  </>
                ) : (
                  continueLabel
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
