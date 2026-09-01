"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  KeyRound,
  Loader2,
  PhoneForwarded,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePhoneNumberDialog } from "@/components/account/change-phone-number-dialog";
import { RecoveryPinDialog } from "@/components/account/recovery-pin-dialog";
import { SecurityNotifications } from "@/components/account/security-notifications";
import { toast } from "sonner";

type Props = {
  backHref: string;
};

type SecurityStatus = {
  role: "salon" | "stylist";
  currentPhone: string;
  hasRecoveryPin: boolean;
};

export function AccountSecurityPanel({ backHref }: Props) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [changePhoneOpen, setChangePhoneOpen] = useState(false);
  const [pinDialogMode, setPinDialogMode] = useState<"create" | "change" | null>(
    null
  );

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account/security", {
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Could not load security settings");
        return;
      }
      setStatus(result.data as SecurityStatus);
    } catch {
      toast.error("Could not load security settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status) {
    return (
      <p className="text-sm text-muted-foreground">
        Security settings are unavailable right now.{" "}
        <a href={backHref} className="text-primary underline-offset-4 hover:underline">
          Back to profile
        </a>
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Security</h1>
        <p className="text-muted-foreground">
          Manage your login phone number and account recovery options.
        </p>
      </div>

      <SecurityNotifications />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="size-4 text-primary" aria-hidden />
            Security options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-0">
          <button
            type="button"
            className="flex w-full items-center gap-3 border-t px-4 py-4 text-left transition-colors hover:bg-muted/50 sm:px-6"
            onClick={() => setChangePhoneOpen(true)}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
              <PhoneForwarded className="size-4 text-primary" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                Change Phone Number
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Verify your current number, then confirm a new mobile number
              </span>
            </span>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 border-t px-4 py-4 text-left transition-colors hover:bg-muted/50 sm:px-6"
            onClick={() =>
              setPinDialogMode(status.hasRecoveryPin ? "change" : "create")
            }
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
              <KeyRound className="size-4 text-primary" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                {status.hasRecoveryPin
                  ? "Change Recovery PIN"
                  : "Create New Recovery PIN"}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {status.hasRecoveryPin
                  ? "Update your 6-digit account recovery PIN"
                  : "Set a 6-digit PIN for account recovery without your old number"}
              </span>
            </span>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </button>
        </CardContent>
      </Card>

      <ChangePhoneNumberDialog
        open={changePhoneOpen}
        onOpenChange={setChangePhoneOpen}
        currentPhone={status.currentPhone}
        onComplete={(result) => {
          if (result.phone) {
            setStatus((prev) =>
              prev ? { ...prev, currentPhone: result.phone } : prev
            );
          }
        }}
      />

      {pinDialogMode && (
        <RecoveryPinDialog
          open={Boolean(pinDialogMode)}
          onOpenChange={(open) => {
            if (!open) setPinDialogMode(null);
          }}
          mode={pinDialogMode}
          onComplete={() => {
            void loadStatus();
          }}
        />
      )}
    </div>
  );
}
