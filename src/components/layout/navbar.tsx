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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
            Stylist Verify
          </span>
        </Link>

        {variant === "landing" && (
          <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
            <a
              href="#why"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Why Stylist Verify
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              How It Works
            </a>
            <a
              href="#benefits"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Benefits
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              FAQ
            </a>
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center justify-end">
          <ThemeToggle />
          {variant === "auth" && (
            <LinkButton href="/" variant="ghost" className="ml-2">
              Home
            </LinkButton>
          )}
        </div>
      </div>
    </header>
  );
}
