import Image from "next/image";
import type { SalonIdentityFields } from "@/types";
import { DEFAULT_SALON_TYPE } from "@/lib/salon-constants";
import { SalonTypeBadge } from "@/components/salon-type-badge";
import { cn } from "@/lib/utils";

interface SalonIdentityProps extends Partial<SalonIdentityFields> {
  className?: string;
  logoSize?: "sm" | "md";
  nameSuffix?: React.ReactNode;
}

export function SalonIdentity({
  salonName,
  salonLogoUrl,
  salonType = DEFAULT_SALON_TYPE,
  className,
  logoSize = "md",
  nameSuffix,
}: SalonIdentityProps) {
  const sizeClass = logoSize === "sm" ? "size-10" : "size-12";

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-primary",
          sizeClass
        )}
      >
        {salonLogoUrl ? (
          <Image
            src={salonLogoUrl}
            alt={`${salonName} logo`}
            fill
            className="object-cover"
          />
        ) : (
          <span className="text-xs font-semibold text-primary-foreground">
            {(salonName ?? "SV").trim().slice(0, 2).toUpperCase() || "SV"}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate font-semibold">{salonName}</p>
          {nameSuffix}
        </div>
        <SalonTypeBadge type={salonType} className="mt-1" />
      </div>
    </div>
  );
}
