"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  DashboardSidebarBrand,
  DashboardSidebarNav,
} from "@/components/dashboard/dashboard-sidebar-nav";
import { DASHBOARD_TOP_BAR_CLASS } from "@/lib/dashboard-layout";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  interestedCount?: number;
  className?: string;
  onNavigate?: () => void;
}

/**
 * Desktop left sidebar. Mobile uses the same nav inside a Sheet.
 */
export function DashboardSidebar({
  interestedCount: initialCount = 0,
  className,
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [interestedCount, setInterestedCount] = useState(initialCount);

  useEffect(() => {
    setInterestedCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/applications/interested-count");
        const result = await res.json();
        if (!cancelled && result.success) {
          setInterestedCount(result.data.count as number);
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
      className={cn(
        "flex h-full flex-col border-border bg-card",
        className
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-border px-4",
          DASHBOARD_TOP_BAR_CLASS
        )}
      >
        <DashboardSidebarBrand onNavigate={onNavigate} />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <DashboardSidebarNav
          interestedCount={interestedCount}
          onNavigate={onNavigate}
        />
      </div>
    </aside>
  );
}
