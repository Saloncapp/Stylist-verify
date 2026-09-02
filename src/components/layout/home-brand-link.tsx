"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { cn } from "@/lib/utils";

export const HOME_HERO_ID = "hero";
export const HOME_HERO_HREF = "/#hero";
export const HOME_PHONE_INPUT_ID = "home-auth-phone";

export function scrollToHomeHero(behavior: ScrollBehavior = "smooth") {
  const hero = document.getElementById(HOME_HERO_ID);
  hero?.scrollIntoView({ behavior, block: "start" });

  window.requestAnimationFrame(() => {
    const phone = document.getElementById(HOME_PHONE_INPUT_ID);
    if (phone instanceof HTMLElement) {
      phone.focus({ preventScroll: true });
    }
  });

  window.dispatchEvent(new CustomEvent("stylist-verify:home-hero"));
}

export function handleHomeHeroClick(
  pathname: string,
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void,
) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    if (pathname === "/") {
      event.preventDefault();
      window.history.replaceState(null, "", HOME_HERO_HREF);
      scrollToHomeHero();
    }
  };
}

type HomeBrandLinkProps = Omit<ComponentProps<typeof Link>, "href">;

/** Logo / brand link — always returns to the home hero (verify CTA + mobile form). */
export function HomeBrandLink({
  className,
  children,
  onClick,
  ...props
}: HomeBrandLinkProps) {
  const pathname = usePathname();

  return (
    <Link
      href={HOME_HERO_HREF}
      className={cn(className)}
      aria-label="Stylist Verify home"
      onClick={handleHomeHeroClick(pathname, onClick)}
      {...props}
    >
      {children}
    </Link>
  );
}
