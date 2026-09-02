"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  HOME_HERO_ID,
  scrollToHomeHero,
} from "@/components/layout/home-brand-link";

/** Scroll to hero when landing on /#hero from another route. */
export function HomeHashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;
    if (window.location.hash !== `#${HOME_HERO_ID}`) return;

    // Wait for hero + mobile form to mount after client navigation.
    const id = window.requestAnimationFrame(() => {
      scrollToHomeHero("auto");
    });
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
