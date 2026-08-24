"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getStylistInitial } from "@/lib/stylist-initials";
import { cn } from "@/lib/utils";

type StylistAvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type StylistAvatarVariant = "card" | "profile";

const SIZE_CONFIG: Record<
  StylistAvatarSize,
  { container: string; text: string; imageSizes: string }
> = {
  xs: { container: "size-6", text: "text-[0.65rem]", imageSizes: "24px" },
  sm: { container: "size-10", text: "text-xs", imageSizes: "40px" },
  md: { container: "size-11", text: "text-sm", imageSizes: "44px" },
  lg: { container: "size-12", text: "text-sm", imageSizes: "48px" },
  xl: { container: "size-16", text: "text-lg", imageSizes: "64px" },
  "2xl": { container: "size-28", text: "text-3xl", imageSizes: "112px" },
};

interface StylistAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: StylistAvatarSize;
  variant?: StylistAvatarVariant;
  className?: string;
  alt?: string;
}

export function StylistAvatar({
  name,
  photoUrl,
  size = "md",
  variant = "card",
  className,
  alt,
}: StylistAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const config = SIZE_CONFIG[size];
  const initial = getStylistInitial(name);
  const showPhoto = Boolean(photoUrl?.trim()) && !imageError;

  useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden",
        config.container,
        variant === "profile"
          ? "rounded-full bg-primary"
          : "rounded-xl border border-border bg-primary/10",
        className
      )}
      aria-hidden={alt ? undefined : true}
    >
      {showPhoto ? (
        <Image
          src={photoUrl!}
          alt={alt ?? name}
          fill
          className="object-cover"
          sizes={config.imageSizes}
          onError={() => setImageError(true)}
        />
      ) : (
        <span
          className={cn(
            "font-semibold leading-none",
            config.text,
            variant === "profile"
              ? "text-primary-foreground"
              : "text-primary"
          )}
        >
          {initial}
        </span>
      )}
    </div>
  );
}
