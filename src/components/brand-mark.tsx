import Image from "next/image";
import { cn } from "@/lib/utils";

/** Shared mark — transparent around shield for teal chrome. */
const BRAND_MARK_SRC = "/brand/stylist-verify-mark.png?v=1";

type BrandMarkProps = {
  className?: string;
  /** Outer frame size in px. Default 48. */
  size?: number;
  priority?: boolean;
  /**
   * `plain` / `navbar` — transparent around shield (default).
   * `badge` — white rounded tile behind logo (avoid on teal chrome).
   */
  variant?: "plain" | "badge" | "navbar";
};

/**
 * Stylist Verify brand mark (shield + scissors + check).
 */
export function BrandMark({
  className,
  size = 48,
  priority = false,
  variant = "plain",
}: BrandMarkProps) {
  const image = (
    <Image
      src={BRAND_MARK_SRC}
      alt="Stylist Verify"
      width={size}
      height={size}
      priority={priority}
      unoptimized
      className={cn(
        "shrink-0 object-contain",
        variant === "badge" ? "size-full" : className
      )}
    />
  );

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm",
          className
        )}
        style={{ width: size, height: size }}
      >
        {image}
      </span>
    );
  }

  return image;
}
