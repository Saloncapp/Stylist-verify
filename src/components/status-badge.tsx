import type { StylistStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<StylistStatus, string> = {
  Active: "bg-success/10 text-success border-success/20",
  Relieved: "bg-warning/10 text-warning border-warning/20",
  Abscond: "bg-danger/10 text-danger border-danger/20",
};

export function StatusBadge({
  status,
  className,
}: {
  status: StylistStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusStyles[status], className)}
    >
      {status}
    </Badge>
  );
}
