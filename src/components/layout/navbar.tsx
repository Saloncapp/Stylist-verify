"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { LinkButton } from "@/components/link-button";
import { BrandMark } from "@/components/brand-mark";
import { HomeBrandLink, HOME_HERO_HREF } from "@/components/layout/home-brand-link";

interface NavbarProps {
  variant?: "landing" | "auth" | "dashboard";
}

export function Navbar({ variant = "landing" }: NavbarProps) {
  const reduceMotion = useReducedMotion();
  const playIntro = variant === "landing" && !reduceMotion;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <HomeBrandLink className="group flex shrink-0 items-center gap-2.5">
          <motion.span
            className="inline-flex items-center gap-2.5"
            initial={playIntro ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={
              playIntro
                ? { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0 }
            }
          >
            <BrandMark size={60} className="size-16" priority />
            <span className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl">
              Stylist Verify
            </span>
          </motion.span>
        </HomeBrandLink>

        {variant === "landing" && (
          <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
            {(
              [
                { href: "#why", label: "Why Stylist Verify" },
                { href: "#how-it-works", label: "How It Works" },
                { href: "#benefits", label: "Benefits" },
                { href: "#faq", label: "FAQ" },
              ] as const
            ).map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:text-primary focus-visible:underline focus-visible:outline-none"
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center justify-end">
          <ThemeToggle />
          {variant === "auth" && (
            <LinkButton href={HOME_HERO_HREF} variant="ghost" className="ml-2">
              Home
            </LinkButton>
          )}
        </div>
      </div>
    </header>
  );
}
