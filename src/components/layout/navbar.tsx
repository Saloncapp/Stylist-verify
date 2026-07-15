import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LinkButton } from "@/components/link-button";

interface NavbarProps {
  variant?: "landing" | "auth" | "dashboard";
}

export function Navbar({ variant = "landing" }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Salon Staff
          </span>
        </Link>

        {variant === "landing" && (
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#why" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Why Salon Staff
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              How It Works
            </a>
            <a href="#benefits" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Benefits
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {variant === "landing" && (
            <>
              <LinkButton href="/verify" variant="ghost" className="hidden sm:inline-flex">
                Verify Stylist
              </LinkButton>
              <LinkButton href="/login">Login</LinkButton>
            </>
          )}
          {variant === "auth" && (
            <LinkButton href="/" variant="ghost">
              Home
            </LinkButton>
          )}
        </div>
      </div>
    </header>
  );
}
