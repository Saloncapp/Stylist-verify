import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types";

const STATUS_STYLES: Record<
  ApplicationStatus,
  { badge: string; color: string }
> = {
  Interested: {
    color: "#0F6B5F",
    badge: "bg-primary/15 text-primary",
  },
  Hired: {
    color: "#B5945F",
    badge: "bg-brand-accent-soft text-brand-accent",
  },
  Rejected: {
    color: "#C44B4B",
    badge: "bg-destructive/10 text-destructive",
  },
};

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function ApplicationStatusBadge({
  status,
  className,
}: ApplicationStatusBadgeProps) {
  const styles = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "shrink-0 rounded-md px-2 py-0.5 text-[0.65rem] font-medium",
        styles.badge,
        className
      )}
    >
      {status}
    </span>
  );
}

export function getApplicationStatusColor(status: ApplicationStatus): string {
  return STATUS_STYLES[status].color;
}
