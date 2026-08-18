import type { SalonType } from "@/lib/salon-constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const salonTypeStyles: Record<SalonType, string> = {
  Unisex: "bg-primary/10 text-primary border-primary/20",
  Men: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400",
  Women: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400",
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
