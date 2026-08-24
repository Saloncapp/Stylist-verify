import { MapPin, Phone } from "lucide-react";
import { StylistAvatar } from "@/components/stylist-avatar";
import type { HiringApplicationCard } from "@/types";

interface ApplicantPreviewCardProps {
  application: HiringApplicationCard;
}

/** Read-only applicant row for dashboard preview panels. */
export function ApplicantPreviewCard({ application }: ApplicantPreviewCardProps) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <StylistAvatar
        name={application.stylistName}
        photoUrl={application.stylistPhotoUrl}
        size="md"
        alt={application.stylistName}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{application.stylistName}</p>
        <p className="truncate text-sm text-muted-foreground">
          {application.latestRole || "Stylist"} · for {application.jobRole}
        </p>
        {application.stylistAddress ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{application.stylistAddress}</span>
          </p>
        ) : null}
      </div>

      <p className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
        <Phone className="size-3 shrink-0 text-[#2563EB]" />
        <span className="whitespace-nowrap">{application.stylistMobile}</span>
      </p>
    </div>
  );
}
