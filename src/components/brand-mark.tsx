import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  /** Outer frame size in px. Default 48. */
  size?: number;
  priority?: boolean;
};

/**
 * Stylist Verify brand mark (shield + scissors + check).
 * Use next to the wordmark in nav, sidebar, and footer.
 */
export function BrandMark({
  className,
  size = 48,
  priority = false,
}: BrandMarkProps) {
  return (
    <Image
      src="/brand/stylist-verify-mark.png"
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 object-contain", className)}
      aria-hidden
    />
  );
}
