"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, X } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { Button } from "@/components/ui/button";
import {
  dismissRecoveryPinReminder,
  isRecoveryPinReminderDismissed,
} from "@/lib/recovery-pin-reminder";

export function RecoveryPinReminder() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isRecoveryPinReminderDismissed()) {
        setVisible(false);
        return;
      }
      const res = await fetch("/api/account/security", {
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) {
        setVisible(false);
        return;
      }
      setVisible(!result.data?.hasRecoveryPin);
    } catch {
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !visible) return null;

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <div className="flex min-w-0 items-start gap-3">
        <Shield className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold">Set up your Recovery PIN</p>
          <p className="text-sm text-amber-900/80">
            Add a 6-digit PIN so you can recover your account if you lose access
            to your registered mobile number.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
        <LinkButton href="/setup-recovery-pin" size="sm">
          Set Up Now
        </LinkButton>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 text-amber-800 hover:bg-amber-100 hover:text-amber-950"
          aria-label="Dismiss reminder"
          onClick={() => {
            dismissRecoveryPinReminder();
            setVisible(false);
          }}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
