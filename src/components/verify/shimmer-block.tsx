import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Muted block with left→right shimmer; size via className. */
export function ShimmerBlock({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-md animate-shimmer", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
