"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { StylistAvatar } from "@/components/stylist-avatar";
import { OpenToWorkToggle } from "@/components/hiring/open-to-work-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { StylistSidebar } from "@/components/stylist/stylist-sidebar";
import { DASHBOARD_TOP_BAR_CLASS } from "@/lib/dashboard-layout";
import { logoutToHome } from "@/lib/logout";
import { cn } from "@/lib/utils";
import type { StylistAccount } from "@/types";

interface StylistHeaderProps {
  stylist: StylistAccount;
  pendingInterestCount?: number;
}

/**
 * Top bar only: mobile menu, theme, Open to Work, profile chip, logout.
 * Primary nav lives in the left sidebar.
 */
export function StylistHeader({
  stylist,
  pendingInterestCount = 0,
}: StylistHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logoutToHome();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-4 sm:px-6",
          DASHBOARD_TOP_BAR_CLASS
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <p className="truncate text-sm font-medium text-muted-foreground lg:hidden">
            Menu
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />

          <OpenToWorkToggle
            initialOpenToWork={Boolean(stylist.openToWork)}
            variant="header"
          />

          <Link
            href="/stylist/profile"
            className="flex h-9 max-w-[9rem] items-center gap-2 truncate rounded-lg border border-primary/30 bg-primary/10 px-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15 sm:max-w-[14rem] sm:px-3"
            title="Stylist profile"
          >
            <StylistAvatar
              name={stylist.name}
              photoUrl={stylist.photoUrl}
              size="xs"
              className="rounded-md"
              alt={stylist.name}
            />
            <span className="hidden truncate sm:inline">{stylist.name}</span>
          </Link>

          <Button
            variant="destructive"
            className="hidden h-9 border-destructive/30 px-3 hover:bg-destructive/15 sm:inline-flex"
            onClick={() => void handleLogout()}
          >
            <LogOut className="mr-2 size-4" />
            Logout
          </Button>
          <Button
            variant="destructive"
            size="icon-lg"
            className="border-destructive/30 hover:bg-destructive/15 sm:hidden"
            onClick={() => void handleLogout()}
            aria-label="Logout"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[min(18rem,85vw)] p-0 sm:max-w-xs"
          showCloseButton
        >
          <SheetTitle className="sr-only">Stylist navigation</SheetTitle>
          <StylistSidebar
            pendingInterestCount={pendingInterestCount}
            className="h-full border-0"
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </header>
  );
}
