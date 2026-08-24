"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  StylistSidebarBrand,
  StylistSidebarNav,
} from "@/components/stylist/stylist-sidebar-nav";
import { DASHBOARD_TOP_BAR_CLASS } from "@/lib/dashboard-layout";
import { cn } from "@/lib/utils";

interface StylistSidebarProps {
  pendingInterestCount?: number;
  className?: string;
  onNavigate?: () => void;
}

/** Desktop left sidebar. Mobile uses the same nav inside a Sheet. */
export function StylistSidebar({
  pendingInterestCount: initialCount = 0,
  className,
  onNavigate,
}: StylistSidebarProps) {
  const pathname = usePathname();
  const [pendingInterestCount, setPendingInterestCount] = useState(initialCount);

  useEffect(() => {
    setPendingInterestCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/me/interests/pending-count");
        const result = await res.json();
        if (!cancelled && result.success) {
          setPendingInterestCount(result.data.count as number);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <aside
      className={cn("flex h-full flex-col border-border bg-card", className)}
    >
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-border px-4",
          DASHBOARD_TOP_BAR_CLASS
        )}
      >
        <StylistSidebarBrand onNavigate={onNavigate} />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <StylistSidebarNav
          pendingInterestCount={pendingInterestCount}
          onNavigate={onNavigate}
        />
      </div>
    </aside>
  );
}
