"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleDigitInput } from "@/lib/digit-input";
import { clearRecoveryPinReminderDismissal } from "@/lib/recovery-pin-reminder";

type Step = "intro" | "create" | "confirm" | "success";

type Props = {
  homePath: string;
};

export function SetupRecoveryPinFlow({ homePath }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/account/security", {
          credentials: "include",
        });
        const result = await res.json();
        if (cancelled) return;
        if (!result.success) {
          router.replace("/");
          return;
        }
        if (result.data?.hasRecoveryPin) {
          router.replace(homePath);
        }
      } catch {
        if (!cancelled) router.replace("/");
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [homePath, router]);

  function goHome() {
    router.push(homePath);
    router.refresh();
  }

  function handleSkip() {
    goHome();
  }

  function handleContinue() {
    setError(null);
    if (step === "create") {
      if (!/^\d{6}$/.test(pin)) {
        setError("Recovery PIN must be exactly 6 digits.");
        return;
      }
      setStep("confirm");
      return;
    }
    void submit();
  }

  async function submit() {
    setError(null);
    if (!/^\d{6}$/.test(pin)) {
      setError("Recovery PIN must be exactly 6 digits.");
      setStep("create");
      return;
    }
    if (pin !== confirmPin) {
      setError("PIN and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/account/recovery-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "create",
          pin,
          confirmPin,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Could not save recovery PIN.");
        return;
      }
      clearRecoveryPinReminderDismissal();
      setStep("success");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <Shield className="size-7" aria-hidden />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Secure Your Account
            </h1>
            <p className="text-sm text-muted-foreground">
              Create a 6-digit PIN to help recover your account if you lose
              access to your registered mobile number.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button type="button" onClick={() => setStep("create")}>
            Set Up Now
          </Button>
          <Button type="button" variant="outline" onClick={handleSkip}>
            Skip for Now
          </Button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <CheckCircle2 className="size-8" aria-hidden />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Recovery PIN Created
            </h1>
            <p className="text-sm text-muted-foreground">
              Your account is now protected. You can change this PIN anytime
              from Account Security.
            </p>
          </div>
        </div>
        <Button type="button" className="w-full" onClick={goHome}>
          Go to Home
        </Button>
      </div>
    );
  }

  const activeValue = step === "create" ? pin : confirmPin;
  const setActiveValue = step === "create" ? setPin : setConfirmPin;
  const inputId =
    step === "create" ? "setup-recovery-pin" : "setup-recovery-pin-confirm";

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {step === "create"
            ? "Set up your Recovery PIN"
            : "Confirm Recovery PIN"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === "create"
            ? "Create a 6-digit PIN to help recover your account if you lose access to your registered mobile number."
            : "Re-enter your recovery PIN to confirm."}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {(["create", "confirm"] as const).map((item, index) => (
          <div
            key={item}
            className={`h-1.5 flex-1 rounded-full ${
              (step === "create" && index === 0) || step === "confirm"
                ? "bg-primary"
                : "bg-muted"
            }`}
            aria-hidden
          />
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor={inputId}>
          {step === "create"
            ? "Create 6-Digit Recovery PIN"
            : "Confirm Recovery PIN"}
        </Label>
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
          disabled={submitting}
          autoFocus
          className="text-center text-lg tracking-[0.4em]"
          placeholder="••••••"
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          disabled={submitting || activeValue.length !== 6}
          onClick={handleContinue}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving…
            </>
          ) : step === "confirm" ? (
            "Set Up Recovery PIN"
          ) : (
            "Continue"
          )}
        </Button>
        {step === "create" ? (
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={handleSkip}
          >
            Skip for Now
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={() => {
              setConfirmPin("");
              setError(null);
              setStep("create");
            }}
          >
            Back
          </Button>
        )}
      </div>
    </div>
  );
}
