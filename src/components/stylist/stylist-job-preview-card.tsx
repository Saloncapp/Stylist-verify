import { Building2, MapPin } from "lucide-react";
import type { HiringJobCard } from "@/types";

interface StylistJobPreviewCardProps {
  job: HiringJobCard;
}

/** Compact row for stylist dashboard Recent Jobs panel. */
export function StylistJobPreviewCard({ job }: StylistJobPreviewCardProps) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
        <Building2 className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-black">{job.role}</p>
        <p className="truncate text-sm text-black">
          {job.salonName}
          {job.employmentType ? (
            <span className="text-muted-foreground">
              {" "}
              · {job.employmentType}
            </span>
          ) : null}
        </p>
        {job.salonAddress ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{job.salonAddress}</span>
          </p>
        ) : null}
      </div>
      {job.applied ? (
        <span className="shrink-0 rounded-md bg-success/15 px-2 py-0.5 text-[0.65rem] font-medium text-success">
          Applied
        </span>
      ) : null}
    </div>
  );
}
