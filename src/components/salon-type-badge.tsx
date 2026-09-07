import type { SalonType } from "@/lib/salon-constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const salonTypeStyles: Record<SalonType, string> = {
  Unisex: "bg-primary/10 text-primary border-primary/20",
  Men: "bg-brand-highlight/15 text-primary border-brand-highlight/30 dark:text-brand-highlight",
  Women: "bg-brand-accent-soft text-brand-accent border-brand-accent/25",
};

export function SalonTypeBadge({
  type,
  className,
}: {
  type: SalonType;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", salonTypeStyles[type], className)}
    >
      {type}
    </Badge>
  );
}
