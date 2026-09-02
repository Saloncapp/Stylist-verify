"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SetupRecoveryPinFlow } from "@/components/account/setup-recovery-pin-flow";
import { Loader2 } from "lucide-react";

export function SetupRecoveryPinPageClient() {
  const router = useRouter();
  const [homePath, setHomePath] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const result = await res.json();
        if (cancelled) return;
        if (!result.success || !result.data?.role) {
          router.replace("/");
          return;
        }
        setHomePath(
          result.data.role === "salon" ? "/dashboard" : "/stylist"
        );
      } catch {
        if (!cancelled) router.replace("/");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!homePath) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <SetupRecoveryPinFlow homePath={homePath} />;
}
