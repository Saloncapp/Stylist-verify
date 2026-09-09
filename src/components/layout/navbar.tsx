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
    <header className="sticky top-0 z-50 w-full bg-[#0F6B5F] text-white">
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
            <BrandMark size={48} className="size-12" variant="navbar" priority />
            <span className="text-xl font-bold tracking-tight text-white transition-colors group-hover:text-[#B5945F] group-focus-visible:text-[#B5945F] dark:text-white dark:group-hover:text-[#B5945F] dark:group-focus-visible:text-[#B5945F] sm:text-2xl">
              Stylist Verify
            </span>
          </motion.span>
        </HomeBrandLink>

        {variant === "landing" && (
          <nav className="hidden flex-1 items-center justify-center gap-7 md:flex lg:gap-8">
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
                className="relative pb-0.5 text-[0.85rem] font-medium text-[#F5EDDF] transition-colors duration-300 ease-out hover:text-[#B5945F] focus-visible:text-[#B5945F] focus-visible:outline-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-[#B5945F] after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100"
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center justify-end">
          <ThemeToggle className="relative overflow-hidden text-white transition-colors duration-300 ease-out hover:bg-transparent hover:text-[#0B2F2A] dark:hover:text-[#0B2F2A] before:absolute before:inset-0 before:origin-left before:scale-x-0 before:bg-[#B5945F] before:transition-transform before:duration-300 before:ease-out hover:before:scale-x-100 focus-visible:before:scale-x-100 [&_svg]:relative [&_svg]:z-10" />
          {variant === "auth" && (
            <LinkButton
              href={HOME_HERO_HREF}
              variant="ghost"
              className="relative ml-2 overflow-hidden text-white transition-colors duration-300 ease-out hover:bg-transparent hover:text-[#0B2F2A] dark:hover:text-[#0B2F2A] before:absolute before:inset-0 before:origin-left before:scale-x-0 before:bg-[#B5945F] before:transition-transform before:duration-300 before:ease-out hover:before:scale-x-100 focus-visible:before:scale-x-100"
            >
              <span className="relative z-10">Home</span>
            </LinkButton>
          )}
        </div>
      </div>
    </header>
  );
}
