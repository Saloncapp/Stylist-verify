"use client";

import { useEffect, type RefObject } from "react";
import { usePathname } from "next/navigation";

/** Focus an input whenever the route changes or enabled/deps update (e.g. return to home). */
export function useAutofocus<T extends HTMLElement>(
  ref: RefObject<T | null>,
  enabled = true,
  deps: unknown[] = []
) {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) return;
    const frame = window.requestAnimationFrame(() => {
      ref.current?.focus({ preventScroll: false });
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pathname retriggers focus on navigation
  }, [enabled, pathname, ref, ...deps]);
}

/** Focus by element id — useful when the input ref comes from react-hook-form register. */
export function useAutofocusById(
  elementId: string | null | undefined,
  enabled = true,
  deps: unknown[] = []
) {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled || !elementId) return;
    const frame = window.requestAnimationFrame(() => {
      const el = document.getElementById(elementId);
      if (el instanceof HTMLElement) {
        el.focus({ preventScroll: false });
      }
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pathname retriggers focus on navigation
  }, [enabled, elementId, pathname, ...deps]);
}
