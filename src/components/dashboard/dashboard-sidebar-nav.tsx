"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { SALON_NAV_ITEMS } from "@/lib/salon-nav";
import { cn } from "@/lib/utils";

const NAV_MOTION_TRANSITION = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1] as const,
};

interface DashboardSidebarNavProps {
  interestedCount?: number;
  onNavigate?: () => void;
  className?: string;
}

export function DashboardSidebarNav({
  interestedCount = 0,
  onNavigate,
  className,
}: DashboardSidebarNavProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <LayoutGroup id="salon-dashboard-sidebar">
      <nav
        className={cn("flex flex-col gap-1", className)}
        aria-label="Salon dashboard"
      >
        {SALON_NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          const badge =
            item.showApplicantBadge && interestedCount > 0
              ? interestedCount
              : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                "transition-colors duration-200 ease-in-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="salon-dashboard-nav-active"
                  className="absolute inset-0 rounded-xl bg-primary/10 shadow-sm ring-1 ring-primary/20"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : NAV_MOTION_TRANSITION
                  }
                />
              ) : null}
              <Icon
                className="relative z-10 size-4 shrink-0 transition-colors duration-200 ease-in-out"
                aria-hidden="true"
              />
              <span className="relative z-10 min-w-0 flex-1 truncate">
                {item.label}
              </span>
              {badge != null ? (
                <span className="relative z-10 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1 text-[0.65rem] font-semibold text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </LayoutGroup>
  );
}

export function DashboardSidebarBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/dashboard"
      onClick={onNavigate}
      className="flex min-w-0 items-center gap-2.5 px-1"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ShieldCheck className="size-4" />
      </div>
      <span className="truncate font-semibold tracking-tight">
        Stylist Verify
      </span>
    </Link>
  );
}
