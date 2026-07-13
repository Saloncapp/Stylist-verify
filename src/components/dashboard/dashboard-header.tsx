"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, ShieldCheck } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SalonUser } from "@/types";
import { toast } from "sonner";

interface DashboardHeaderProps {
  salon: SalonUser;
}

export function DashboardHeader({ salon }: DashboardHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Logged out successfully");
    router.push("/login");
    router.refresh();
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/stylists", label: "All Stylists" },
    { href: "/dashboard/stylists/add", label: "Add Stylist" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-4" />
            </div>
            <span className="hidden font-semibold sm:inline">StylistVerify</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <LinkButton key={link.href} href={link.href} variant="ghost" size="sm">
                {link.label}
              </LinkButton>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent side="right">
              <nav className="mt-8 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <LinkButton
                    key={link.href}
                    href={link.href}
                    variant="ghost"
                    className="justify-start"
                  >
                    {link.label}
                  </LinkButton>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="hidden items-center gap-2 sm:flex">
            <div className="max-w-[180px] truncate rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium">
              {salon.salonName}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Logout
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="sm:hidden"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
