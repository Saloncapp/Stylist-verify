import { Briefcase, MapPin } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/hiring/application-status-badge";
import type { HiringApplicationCard } from "@/types";

interface StylistApplicationPreviewCardProps {
  application: HiringApplicationCard;
}

/** Compact row for stylist dashboard Applications panel. */
export function StylistApplicationPreviewCard({
  application,
}: StylistApplicationPreviewCardProps) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40">
        <Briefcase className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[#2563EB]">
          {application.jobRole}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {application.salonName}
        </p>
        {application.salonAddress ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{application.salonAddress}</span>
          </p>
        ) : null}
      </div>
      <ApplicationStatusBadge status={application.status} />
    </div>
  );
}
